# frozen_string_literal: true

require 'bundler/setup'
require 'date'
require 'discordrb'
require 'time'
require_relative 'battle_store'

# The final channel number that was imported from Slack
FINAL_SLACK_CHANNEL_NUMBER = 68

# The maximum number of channel messages that can be retrieved in a single request
MAX_CHANNEL_HISTORY_AMOUNT = 100

# Each day's worth of pins in imported channels were separated by a timestamp in a code block, e.g. `----------2016-10-13----------`
TIMESTAMP_MESSAGE_PREFIX = '`----------'
TIMESTAMP_MESSAGE_POSTFIX = '----------`'

# The number of channels to try before giving up on finding an image pin
MAX_IMAGE_CHANNEL_ATTEMPTS = 10

# Keep archive searches responsive without overwhelming Discord's API
ARCHIVE_SEARCH_CONCURRENCY = 5
ARCHIVE_CACHE_TTL_SECONDS = 300

BATTLE_DURATION_SECONDS = 5 * 60
BATTLE_VOTER_COUNT = 3
BATTLE_EMOJI_A = '🅰️'
BATTLE_EMOJI_B = '🅱️'
DATABASE_PATH = ENV.fetch('PINBOT_DATABASE_PATH', File.expand_path('../data/pinbot.sqlite3', __dir__))

HELP_MESSAGE = <<~'HELP'
  Mention me with one of the following commands:
  • `r`, `random` — send a random pin
  • `ri`, `randomimage` — send a random image pin
  • `pc`, `pincount`, `count` — count pins in this channel
  • `t`, `today` — send a pin from this date in history
  • `b`, `battle` — put two random pins head to head
  • `battle finish` — finish the current battle now
  • `battle cancel` — cancel the current battle
  • `help` — show this message
HELP

$bot = Discordrb::Bot.new(token: ENV['BOT_TOKEN'])
$archive_cache = {}
$archive_cache_mutex = Mutex.new
$battle_store = BattleStore.new(DATABASE_PATH)
$battle_timer_mutex = Mutex.new
$battle_timer = nil

def main

  $bot.message_update do |event|
    next unless event.message.pinned?

    forward_message(event, event.message)
  end

  $bot.ready do |_event|
    restore_active_battle
  end

  $bot.reaction_add do |event|
    handle_battle_reaction(event, removed: false)
  end

  $bot.reaction_remove do |event|
    handle_battle_reaction(event, removed: true)
  end

  $bot.mention do |event|
    next if event.server.nil?

    if is_help_command?(event.content)
      handle_help_command(event)
    elsif is_battle_command?(event.content)
      handle_battle_command(event)
    elsif is_today_command?(event.content)
      handle_today_command(event)
    elsif is_random_image_command?(event.content)
      handle_random_image_command(event)
    elsif is_random_command?(event.content)
      handle_random_command(event)
    elsif is_pin_count_command?(event.content)
      handle_pin_count_command(event)
    end
  end

  $bot.run
end

def handle_battle_command(event)
  action = battle_command_action(event.content)
  if action == 'finish'
    finish_active_battle(event)
    return
  elsif action == 'cancel'
    cancel_active_battle(event)
    return
  end

  if $battle_store.active_battle
    event.send_message('A battle is already underway.')
    return
  end

  pins = random_battle_pins(event)
  if pins.nil?
    event.send_message('I could not find two pins to battle.')
    return
  end

  pin_a, pin_b = pins
  started_at = Time.now
  battle = $battle_store.start_battle(
    pin_a_message_id: pin_a.id,
    pin_a_channel_id: pin_a.channel.id,
    pin_b_message_id: pin_b.id,
    pin_b_channel_id: pin_b.channel.id,
    channel_id: event.channel.id,
    started_at: started_at,
    ends_at: started_at + BATTLE_DURATION_SECONDS
  )
  unless battle
    event.send_message('A battle is already underway.')
    return
  end

  letsgo = custom_emoji(event.server, 'letsgo')
  letsgo_banner = ([letsgo] * 3).join(' ')
  battle_message = event.send_message(
    "#{letsgo_banner} **PIN BATTLE** #{letsgo_banner}\n\n\u200B",
    false,
    [pin_embed(pin_a, BATTLE_EMOJI_A), pin_embed(pin_b, BATTLE_EMOJI_B)]
  )
  $battle_store.attach_message(battle['id'], battle_message.id)
  schedule_battle_timeout(battle['id'], battle['ends_at'])
  battle_message.react(BATTLE_EMOJI_A)
  battle_message.react(BATTLE_EMOJI_B)
rescue StandardError
  $battle_store.cancel_unposted_battle(battle['id']) if defined?(battle) && battle
  raise
end

def custom_emoji(server, name)
  emoji = server.emoji.values.find { |candidate| candidate.name == name }
  emoji ? emoji.to_s : ":#{name}:"
end

def finish_active_battle(event)
  battle = $battle_store.active_battle
  unless battle
    event.send_message('There is no battle underway.')
    return
  end

  resolve_battle(battle['id'])
end

def cancel_active_battle(event)
  battle = $battle_store.active_battle
  unless battle
    event.send_message('There is no battle underway.')
    return
  end

  cancelled = $battle_store.cancel_battle(battle_id: battle['id'])
  return unless cancelled

  cancel_battle_timer
  event.send_message('The battle has been cancelled.')
end

def handle_battle_reaction(event, removed:)
  emoji = event.emoji.name
  return unless [BATTLE_EMOJI_A, BATTLE_EMOJI_B].include?(emoji)
  return if event.user.bot_account?

  battle = $battle_store.active_battle_for_message(event.message_id)
  return unless battle

  pin_id = emoji == BATTLE_EMOJI_A ? battle['pin_a_id'] : battle['pin_b_id']
  counts = if removed
             $battle_store.remove_vote(
               battle_id: battle['id'], discord_user_id: event.user.id, pin_id: pin_id
             )
           else
             $battle_store.record_vote(
               battle_id: battle['id'], discord_user_id: event.user.id, pin_id: pin_id
             )
           end
  return unless counts && counts.values.sum >= BATTLE_VOTER_COUNT

  resolve_battle(battle['id'])
end

def restore_active_battle
  battle = $battle_store.active_battle
  return unless battle

  if battle['discord_battle_message_id'].nil?
    $battle_store.cancel_unposted_battle(battle['id'])
    return
  end

  if Time.parse(battle['ends_at']) <= Time.now
    resolve_battle(battle['id'], timed_out: true)
  else
    schedule_battle_timeout(battle['id'], battle['ends_at'])
  end
end

def schedule_battle_timeout(battle_id, ends_at)
  deadline = Time.parse(ends_at)
  $battle_timer_mutex.synchronize do
    $battle_timer&.kill
    $battle_timer = Thread.new do
      sleep_seconds = deadline - Time.now
      sleep(sleep_seconds) if sleep_seconds.positive?
      resolve_battle(battle_id, timed_out: true)
    rescue StandardError => e
      warn("Battle timer failed: #{e.class}: #{e.message}")
    end
  end
end

def resolve_battle(battle_id, timed_out: false)
  active = $battle_store.active_battle
  return unless active && active['id'] == battle_id

  display_choice_pin_id = [active['pin_a_id'], active['pin_b_id']].sample
  battle = $battle_store.resolve(
    battle_id: battle_id,
    display_choice_pin_id: display_choice_pin_id
  )
  return unless battle

  a_votes = battle['vote_counts'].fetch(battle['pin_a_id'], 0)
  b_votes = battle['vote_counts'].fetch(battle['pin_b_id'], 0)
  if battle['is_draw'] == 1
    choice = battle['display_choice_pin_id'] == battle['pin_a_id'] ? 'A' : 'B'
    $bot.send_message(
      battle['discord_channel_id'],
      "Fine then, I guess I'll have to choose.\n\nPinbot chooses #{choice}.\n\nThe battle is recorded as a draw (#{a_votes}–#{b_votes})."
    )
  else
    winner = battle['winner_pin_id'] == battle['pin_a_id'] ? 'A' : 'B'
    loser = winner == 'A' ? 'B' : 'A'
    winner_embed = winning_pin_embed(battle['winner_pin_id'])
    $bot.send_message(
      battle['discord_channel_id'],
      "✨ **･ﾟ✧ PIN #{winner} WINS ✧ﾟ･** ✨\n\n🏆 #{winner} defeats #{loser}, #{[a_votes, b_votes].max}–#{[a_votes, b_votes].min}. 🏆\n\n**WINNERRRRRRRRRRR**",
      false,
      winner_embed ? [winner_embed] : nil
    )
  end
ensure
  cancel_battle_timer
end

def winning_pin_embed(pin_id)
  pin = $battle_store.pin(pin_id)
  return nil unless pin && pin['discord_channel_id']

  channel = $bot.channel(pin['discord_channel_id'])
  return nil unless channel

  message = channel.load_message(pin['discord_message_id'])
  pin_embed(message)
rescue StandardError => e
  warn("Could not showcase winning pin: #{e.class}: #{e.message}")
  nil
end

def cancel_battle_timer
  $battle_timer_mutex.synchronize do
    if $battle_timer && $battle_timer != Thread.current
      $battle_timer.kill
    end
    $battle_timer = nil
  end
end

def handle_random_command(event)
  pin = random_pin(event)
  forward_message(event, pin)
end

def handle_random_image_command(event)
  pin = random_image_pin(event)
  if pin.nil?
    event.send_message('No image pins found.')
    return
  end

  forward_message(event, pin)
end

def handle_help_command(event)
  event.send_message(HELP_MESSAGE)
end

def handle_today_command(event)
  event.send_message('Searching the archives…')
  result = on_this_day_pin(event)
  if result.nil?
    event.send_message('go f*** yourself')
    return
  end

  pin, timestamp, exact_match = result
  years_ago = Date.today.year - timestamp.year
  label = exact_match ? "ON THIS DAY — #{years_ago} YEARS AGO" : "AROUND THIS TIME — #{years_ago} YEARS AGO"
  forward_message(event, pin, label)
end

def handle_pin_count_command(event)
  channel = $bot.channel(event.channel.id)
  #noinspection RubyNilAnalysis
  pin_count = channel.pins(limit: 500).count
  event.send_message("#{pin_count} :pushpin:")
end

def is_pin_count_command?(content)
  message = content.split('>').last.strip.downcase
  message.start_with?('pc') || message.start_with?('pincount') || message.start_with?('count')
end

def is_random_image_command?(content)
  message = content.split('>').last.strip.downcase
  message.start_with?('ri') || message.start_with?('randomimage')
end

def is_random_command?(content)
  message = content.split('>').last.strip
  message.start_with?('r') || message.start_with?('random') || message.end_with?('r') || message.end_with?('random')
end

def is_help_command?(content)
  message = content.split('>').last.strip.downcase
  message.start_with?('help')
end

def is_today_command?(content)
  message = content.split('>').last.strip.downcase
  message == 't' || message == 'today'
end

def is_battle_command?(content)
  %w[b battle battle\ finish battle\ cancel].include?(content.split('>').last.strip.downcase)
end

def battle_command_action(content)
  content.split('>').last.strip.downcase.delete_prefix('battle').strip
end

def is_imported_channel?(channel)
  channel_number = Integer(channel.name.match(/[0-9]{3}/).to_s.gsub('0', ''))
  channel_number < FINAL_SLACK_CHANNEL_NUMBER
rescue ArgumentError
  false
end

def is_imported_pin?(message)
  is_imported_channel?(message.channel)
end

def forward_message(event, message, title = nil)
  content = ''
  tts = nil
  embed = [pin_embed(message, title)]
  attachments = nil
  allowed_mentions = nil
  message_reference = nil

  event.send_message(content, tts, embed, attachments, allowed_mentions, message_reference)
end

def pin_embed(message, title = nil)
  author = message.author
  timestamp = pin_timestamp(message)
  channel_link = "[##{message.channel.name} • #{timestamp.strftime('%-m/%-d/%Y %l:%M %p')}](#{message.link})"
  message_content = message.content.gsub(/`[0-9]{2}:[0-9]{2}` /, '')
  attachment = message.attachments.empty? ? nil : message.attachments.first
  image = attachment.nil? ? nil : {
    'proxy_url' => attachment.proxy_url,
    'url' => attachment.url,
    'width' => attachment.width,
    'height' => attachment.height,
  }
  embed = {
    'url' => message.link,
    'timestamp' => nil,
    'description' => message_content,
    'author': {
      'name' => author.display_name,
      'icon_url' => author.avatar_url,
    },
    'image' => image,
    'fields': [{
      'name' => '',
      'value' => channel_link,
    }]
  }
  embed['title'] = title unless title.nil?
  embed
end

def random_channel(event)
  channels = event.server.text_channels
  channel = channels.sample
  until /[0-9]+/.match?(channel.name)
    channel = channels.sample
  end

  channel
end

def random_pin(event)
  channel = random_channel(event)
  pins = is_imported_channel?(channel) ? channel.history(100) : channel.pins
  pin = pins.sample

  # Don't return one of the date separator messages from an imported channel
  while pin.content.include?(TIMESTAMP_MESSAGE_PREFIX)
    pin = pins.sample
  end

  pin
end

def random_battle_pins(event)
  pins = []
  50.times do
    pin = random_pin(event)
    next if pin.nil? || pin.content.include?(TIMESTAMP_MESSAGE_PREFIX)
    next if pins.any? { |candidate| candidate.id == pin.id }

    pins << pin
    return pins if pins.length == 2
  end

  nil
end

def random_image_pin(event)
  MAX_IMAGE_CHANNEL_ATTEMPTS.times do
    channel = random_channel(event)
    pins = is_imported_channel?(channel) ? channel.history(100) : channel.pins

    # Don't return one of the date separator messages from an imported channel
    image_pins = pins.select { |pin| pin.attachments.any?(&:image?) && !pin.content.include?(TIMESTAMP_MESSAGE_PREFIX) }

    next if image_pins.empty?

    return image_pins.sample
  end

  nil
end

def on_this_day_pin(event)
  today = Date.today
  historical_pins = historical_pin_candidates(event, today)

  (0..3).each do |days_away|
    matching_dates = days_away.zero? ? [today] : [today - days_away, today + days_away]
    matches = historical_pins.select do |_pin, timestamp|
      matching_dates.any? { |date| timestamp.month == date.month && timestamp.day == date.day }
    end

    next if matches.empty?

    pin, timestamp = matches.sample
    return [pin, timestamp, days_away.zero?]
  end

  nil
end

def historical_pin_candidates(event, today)
  $archive_cache_mutex.synchronize do
    cached = $archive_cache[event.server.id]
    return cached[:pins] if cached && Time.now - cached[:created_at] < ARCHIVE_CACHE_TTL_SECONDS

    channels = event.server.text_channels.select { |channel| /[0-9]+/.match?(channel.name) }
    historical_pins = channels.each_slice(ARCHIVE_SEARCH_CONCURRENCY).flat_map do |channel_batch|
      channel_batch.map { |channel| Thread.new { historical_pins_for_channel(channel, today) } }.flat_map(&:value)
    end

    $archive_cache[event.server.id] = { created_at: Time.now, pins: historical_pins }
    historical_pins
  end
end

def historical_pins_for_channel(channel, today)
  imported_channel = is_imported_channel?(channel)
  pins = imported_channel ? channel.history(MAX_CHANNEL_HISTORY_AMOUNT) : channel.pins
  timestamped_pins = imported_channel ? timestamp_imported_pins(pins) : pins.map { |pin| [pin, pin_timestamp(pin)] }
  timestamped_pins.reject do |pin, timestamp|
    pin.content.include?(TIMESTAMP_MESSAGE_PREFIX) || timestamp.year == today.year
  end
end

def timestamp_imported_pins(pins)
  timestamp_messages = pins.select { |message| message.content.include?(TIMESTAMP_MESSAGE_PREFIX) }
  leading_date = nil

  pins.reject { |pin| pin.content.include?(TIMESTAMP_MESSAGE_PREFIX) }.map do |pin|
    timestamp_message = timestamp_messages.select { |message| message.id < pin.id }.max_by(&:id)
    if timestamp_message.nil?
      leading_date ||= get_imported_pin_timestamp(pin).strftime('%Y-%m-%d')
      timestamp = imported_pin_timestamp(pin, leading_date)
    else
      date = timestamp_message.content.gsub(TIMESTAMP_MESSAGE_PREFIX, '').gsub(TIMESTAMP_MESSAGE_POSTFIX, '')
      timestamp = imported_pin_timestamp(pin, date)
    end

    [pin, timestamp]
  end
end

def imported_pin_timestamp(pin, date)
  timestamp = pin.content.match(/[0-9]{2}:[0-9]{2}/).to_s
  DateTime.parse("#{date}T#{timestamp}")
end

def pin_timestamp(pin)
  return get_imported_pin_timestamp(pin) if is_imported_pin?(pin)

  DateTime.parse(pin.timestamp.to_s).new_offset('-05:00')
end

def get_imported_pin_timestamp(pin)
  messages_before = pin.channel.history(MAX_CHANNEL_HISTORY_AMOUNT, pin.id)

  timestamp_message = messages_before.select { |message| message.content.include?(TIMESTAMP_MESSAGE_PREFIX) }.max_by(&:id)

  return pin.timestamp if timestamp_message.nil?

  date = timestamp_message.content.gsub(TIMESTAMP_MESSAGE_PREFIX, '').gsub(TIMESTAMP_MESSAGE_POSTFIX, '')
  imported_pin_timestamp(pin, date)
end

main

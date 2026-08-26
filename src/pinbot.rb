# frozen_string_literal: true

require 'bundler/setup'
require 'date'
require 'discordrb'

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

HELP_MESSAGE = <<~'HELP'
  Mention me with one of the following commands:
  • `r`, `random` — send a random pin
  • `ri`, `randomimage` — send a random image pin
  • `pc`, `pincount`, `count` — count pins in this channel
  • `t`, `today` — send a pin from this date in history
  • `help` — show this message
HELP

$bot = Discordrb::Bot.new(token: ENV['BOT_TOKEN'])
$archive_cache = {}
$archive_cache_mutex = Mutex.new

def main

  $bot.message_update do |event|
    next unless event.message.pinned?

    forward_message(event, event.message)
  end

  $bot.mention do |event|
    next if event.server.nil?

    if is_help_command?(event.content)
      handle_help_command(event)
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
  forward_message(event, pin, label, timestamp)
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

def is_imported_channel?(channel)
  channel_number = Integer(channel.name.match(/[0-9]{3}/).to_s.gsub('0', ''))
  channel_number < FINAL_SLACK_CHANNEL_NUMBER
rescue ArgumentError
  false
end

def is_imported_pin?(message)
  is_imported_channel?(message.channel)
end

def forward_message(event, message, title = nil, timestamp = nil)
  author = message.author
  timestamp ||= pin_timestamp(message)
  channel_link = "[##{message.channel.name} • #{timestamp.strftime('%-m/%-d/%Y %l:%M %p')}](#{message.link})"
  message_content = message.content.gsub(/`[0-9]{2}:[0-9]{2}` /, '')
  content = ''
  tts = nil
  attachment = message.attachments.empty? ? nil : message.attachments.first
  image = attachment.nil? ? nil : {
    'proxy_url' => attachment.proxy_url,
    'url' => attachment.url,
    'width' => attachment.width,
    'height' => attachment.height,
  }
  embed = [{
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
           }]
  embed.first['title'] = title unless title.nil?
  attachments = nil
  allowed_mentions = nil
  message_reference = nil

  event.send_message(content, tts, embed, attachments, allowed_mentions, message_reference)
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

  timestamp_message = messages_before.reverse.select { |message| message.content.include?(TIMESTAMP_MESSAGE_PREFIX) }.first

  return pin.timestamp if timestamp_message.nil?

  date = timestamp_message.content.gsub(TIMESTAMP_MESSAGE_PREFIX, '').gsub(TIMESTAMP_MESSAGE_POSTFIX, '')
  imported_pin_timestamp(pin, date)
end

main

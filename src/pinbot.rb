# frozen_string_literal: true

require 'bundler/setup'
require 'discordrb'

# The final channel number that was imported from Slack
FINAL_SLACK_CHANNEL_NUMBER = 68

# see https://discord.com/developers/docs/resources/message#message-reference-types
MESSAGE_FORWARD_TYPE = 1

# The maximum number of channel messages that can be retrieved in a single request
MAX_CHANNEL_HISTORY_AMOUNT = 100

# Each day's worth of pins in imported channels were separated by a timestamp in a code block, e.g. `----------2016-10-13----------`
TIMESTAMP_MESSAGE_PREFIX = '`----------'
TIMESTAMP_MESSAGE_POSTFIX = '----------`'

def main
  bot = Discordrb::Bot.new(token: ENV['BOT_TOKEN'])

  bot.message_update do |event|
    next unless event.message.pinned?

    forward_message(event, event.message)
  end

  bot.mention do |event|
    next if event.server.nil? || !is_random_command?(event.content)

    pin = random_pin(event)
    forward_message(event, pin)
  end

  bot.run
end


def is_random_command?(content)
  message = content.split('>').last.strip
  message.end_with?('t') || message.end_with?('test')
end

def is_imported_channel?(channel)
  channel_number = Integer(channel.name.split('_').first.gsub('0', ''))
  channel_number < FINAL_SLACK_CHANNEL_NUMBER
end

def is_imported_pin?(message)
  is_imported_channel?(message.channel)
end

def send_message_context(event, message)
  author = message.author
  timestamp = is_imported_pin?(message) ? get_imported_pin_timestamp(message) : message.timestamp.iso8601
  content = ''
  tts = nil
  embed = [{
     'timestamp' => timestamp,
     'author': {
       'name' => author.display_name,
       'icon_url' => author.avatar_url,
     }
  }]
  attachments = nil
  allowed_mentions = nil
  message_reference = nil

  event.send_message(content, tts, embed, attachments, allowed_mentions, message_reference)
end

def forward_message(event, message)
  send_message_context(event, message)

  content = ''
  tts = nil
  embed = nil
  attachments = nil
  allowed_mentions = nil
  message_reference = {
    'message_id' => message.id,
    'channel_id' => message.channel.id,
    'type' => MESSAGE_FORWARD_TYPE
  }

  event.send_message(content, tts, embed, attachments, allowed_mentions, message_reference)
end

def random_channel(event)
  channels =  event.server.text_channels
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

def get_imported_pin_timestamp(pin)
  messages_before = pin.channel.history(MAX_CHANNEL_HISTORY_AMOUNT, pin.id)

  timestamp_message = messages_before.reverse.select { |message| message.content.include?(TIMESTAMP_MESSAGE_PREFIX) }.first

  return pin.timestamp if timestamp_message.nil?

  timestamp = timestamp_message.content.gsub(TIMESTAMP_MESSAGE_PREFIX, '').gsub(TIMESTAMP_MESSAGE_POSTFIX, '')

  DateTime.parse(timestamp).iso8601
end

main

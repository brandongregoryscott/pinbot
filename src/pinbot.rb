# frozen_string_literal: true

require 'bundler/setup'
require 'discordrb'

# The final channel number that was imported from Slack
FINAL_SLACK_CHANNEL_NUMBER = 68

# see https://discord.com/developers/docs/resources/message#message-reference-types
MESSAGE_FORWARD_TYPE = 1

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
  message.end_with?('r') || message.end_with?('random')
end

def is_imported_channel?(channel)
  channel_number = Integer(channel.name.split('_').first.gsub('0', ''))
  channel_number < FINAL_SLACK_CHANNEL_NUMBER
end

def forward_message(event, message)
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
  while pin.content.include?('`----------')
    pin = pins.sample
  end

  pin
end

main

import botconfig
import random
from Helpers.CallWrapper import CallWrapper
from Models.Command import Command


class Random(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def get_random_pin(self, type):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        # First, we need to grab both the channels (public) and groups (private)
        # from the Slack API
        channels_json = slack_client.api_call("channels.list", token=token)
        groups_json = slack_client.api_call("groups.list", token=token)

        # Extract the individual channels & group JSON Arrays from the responses
        channel_list = channels_json['channels'] + groups_json['groups']

        # Now, we will choose a random 'sadbois' channel
        random_channel = random.choice(channel_list)

        # JGP - simplified while logic
        while not random_channel['name'][0].isdigit():
            random_channel = random.choice(channel_list)

        # Grab the list of pins for this channel from the Slack API
        pins_json = slack_client.api_call("pins.list", token=token, channel=random_channel['id'])
        pins_list = pins_json['items']

        # Select a random pin from the list
        random_pin = random.choice(pins_list)

        # For right now, we'll only pick from text pins
        while random_pin['type'] != type:
            random_pin = random.choice(pins_list)

        return random_pin, random_channel


    def execute_command(self):
        slack_client = self.CLIENT
        channel = self.CHANNEL

        random_pin, random_channel = self.get_random_pin(type=random.choice(['message', 'message', 'message', 'file']))

        attachment = CallWrapper(botconfig.SLACK_BOT_TOKEN).create_pin_attachment(random_pin, random_channel)

        slack_client.api_call('chat.postMessage',
                              channel=channel,
                              attachments=attachment,
                              as_user=True)

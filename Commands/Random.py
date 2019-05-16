import botconfig
import random
import json
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
        random.shuffle(channel_list)
        random_channel = next((x for x in channel_list if x['name'][0].isdigit()))

        # Grab the list of pins for this channel from the Slack API
        pins_json = slack_client.api_call("pins.list", token=token, channel=random_channel['id'])
        pins_list = list(pins_json['items'])

        # Select a random pin from the list
        random.shuffle(pins_list)
        if type == 'file':
            # Old image pins have 'file' type at top object, whereas now they appear in the 'message' key
            random_pin = next((x for x in pins_list if ('message' in x and 'files' in x['message']) or x['type'] == 'file'), None)
        else:
            random_pin = pins_list.pop()

        if random_pin is None:
            self.get_random_pin(type)

        return random_pin, random_channel


    def execute_command(self):
        slack_client = self.CLIENT
        channel = self.CHANNEL

        random_pin, random_channel = self.get_random_pin(type=random.choice(['message', 'message', 'message', 'message', 'message', 'file']))

        attachment = CallWrapper(botconfig.SLACK_BOT_TOKEN).create_pin_attachment(random_pin, random_channel)

        response = slack_client.api_call('chat.postMessage',
                              channel=channel,
                              attachments=attachment,
                              as_user=True)
        print(json.dumps(response, indent=4, sort_keys=True))

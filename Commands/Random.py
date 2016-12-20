import botconfig
import random

from Models.Command import Command


class Random(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN
        channel = self.CHANNEL
        # First, we need to grab both the channels (public) and groups (private)
        # from the Slack API
        channels_json = slack_client.api_call("channels.list", token=token)
        groups_json = slack_client.api_call("groups.list", token=token)
        # Extract the individual channels & group JSON Arrays from the responses
        channel_list = channels_json['channels'] + groups_json['groups']

        # Now, we will choose a random 'sadbois' channel
        random_channel = random.choice(channel_list)

        # JGP - simplified while logic
        while not random_channel['name'].startswith("sadbois"):
            random_channel = random.choice(channel_list)

        # Grab the list of pins for this channel from the Slack API
        pins_json = slack_client.api_call("pins.list", token=token, channel=random_channel['id'])
        pins_list = pins_json['items']

        # Select a random pin from the list
        random_pin = random.choice(pins_list)

        # For right now, we'll only pick from text pins
        while random_pin['type'] != 'message':
            random_pin = random.choice(pins_list)

        message = random_pin['message']

        # Grab information about the posting user from the Slack API
        user_json = slack_client.api_call("users.info", token=token, user=message['user'])
        user = user_json['user']

        # The user's 'profile' JSON object contains more specific info about them
        # https://api.slack.com/methods/users.info
        poster = user['profile']

        # Create an array to hold the attachment object
        attachment = []

        # This attachment object will contain only one pin object
        # Parse out the pertinent data from the objects obtained earlier
        # This ensures proper formatting for the shared pin
        pin_object = {
            'from_url': message['permalink'],
            'channel_id': message['pinned_to'],
            'text': message['text'],
            'author_icon': poster['image_32'],
            'author_name': user['name'],
            'author_link': message['permalink'],
            'channel_name': random_channel['name'],
            'color': "D0D0D0", 'ts': message['ts'],
            'mrkdwn_in': ['text'],
            'footer': "Posted in " + random_channel['name'],
            'is_share': True,
            'is_msg_unfurl': True
        }

        # Finally, append this pin object to the attachment array and post it
        attachment.append(pin_object)
        slack_client.api_call('chat.postMessage',
                              channel=channel,
                              attachments=attachment,
                              as_user=True)
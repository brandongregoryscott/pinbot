import botconfig
import random

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

    def create_attachment(self, pin, channel):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        # Create an array to hold the attachment object
        attachment = []

        if pin['type'] == 'message':
            message = pin['message']

            # Grab information about the posting user from the Slack API
            user_json = slack_client.api_call("users.info", token=token, user=message['user'])
            user = user_json['user']

            # The user's 'profile' JSON object contains more specific info about them
            # https://api.slack.com/methods/users.info
            poster = user['profile']
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
                'channel_name': channel['name'],
                'color': "D0D0D0", 'ts': message['ts'],
                'mrkdwn_in': ['text'],
                'footer': "Posted in " + channel['name'],
                'is_share': True,
                'is_msg_unfurl': True
            }
        elif pin['type'] == 'file':
            file = pin['file']

            # Grab information about the posting user from the Slack API
            user_json = slack_client.api_call("users.info", token=token, user=file['user'])
            user = user_json['user']

            # The user's 'profile' JSON object contains more specific info about them
            # https://api.slack.com/methods/users.info
            poster = user['profile']

            pin_object = {
                'image_url': file['permalink'],
                'channel_id': file['pinned_to'],
                'title': file['title'],
                'title_link': file['url_private'],
                'author_icon': poster['image_32'],
                'author_name': user['name'],
                'channel_name': channel['name'],
                'color': "D0D0D0", 'ts': file['timestamp'],
                'mrkdwn_in': ['title'],
                'footer': "Posted in " + channel['name'],
                'is_share': True,
                'is_msg_unfurl': True
            }

        # Finally, append this pin object to the attachment array and return it
        attachment.append(pin_object)

        return attachment

    def execute_command(self):
        slack_client = self.CLIENT
        channel = self.CHANNEL

        random_pin, random_channel = self.get_random_pin(type=random.choice(['message', 'message', 'message', 'file']))

        attachment = self.create_attachment(random_pin, random_channel)

        slack_client.api_call('chat.postMessage',
                              channel=channel,
                              attachments=attachment,
                              as_user=True)

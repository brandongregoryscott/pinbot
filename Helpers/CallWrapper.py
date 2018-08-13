from slackclient import SlackClient
import re


class CallWrapper(object):
    def __init__(self, api_token):
        self.SLACK_BOT_TOKEN = api_token
        self.SLACK_CLIENT = SlackClient(api_token)

    def get_channel_list(self):
        token = self.SLACK_BOT_TOKEN
        slack_client = self.SLACK_CLIENT

        # First, we need to grab both the channels (public) and groups (private)
        # from the Slack API
        channels_json = slack_client.api_call("channels.list", token=token)
        groups_json = slack_client.api_call("groups.list", token=token)
        # Extract the individual channels & group JSON Arrays from the responses
        channel_list = channels_json['channels'] + groups_json['groups']

        return channel_list

    def get_pin_list(self, channel):
        token = self.SLACK_BOT_TOKEN
        slack_client = self.SLACK_CLIENT

        pins_list = list()
        # Only grab channels/groups that start with a number
        if channel['name'][0].isdigit():
            # Grab the list of pins for this channel from the Slack API
            pins_json = slack_client.api_call("pins.list", token=token, channel=channel['id'])
            pins_list = pins_json['items']

        return pins_list

    def get_channel_info(self, channel_id):
        token = self.SLACK_BOT_TOKEN
        slack_client = self.SLACK_CLIENT

        if channel_id.startswith('C'):
            channel_type = 'channel'
        else:
            channel_type = 'group'
        channel_info = slack_client.api_call(channel_type + 's.info', channel=channel_id)

        if channel_type == 'group':
            channel_info['channel'] = channel_info.pop('group')

        return channel_info

    def get_channel_info_by_name(self, channel_name):
        token = self.SLACK_BOT_TOKEN
        slack_client = self.SLACK_CLIENT

        channel_list = self.get_channel_list()
        for channel_info in channel_list:
            if channel_name == channel_info['name']:
                return channel_info
        raise ValueError("Channel name not found")

    def create_pin_attachment(self, pin, channel):
        slack_client = self.SLACK_CLIENT
        token = self.SLACK_BOT_TOKEN

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

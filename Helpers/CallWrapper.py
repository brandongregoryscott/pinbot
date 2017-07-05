from slackclient import SlackClient


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

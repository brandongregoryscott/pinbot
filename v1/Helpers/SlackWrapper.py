import _thread
import datetime
import time
import json

from slackclient import SlackClient

import botconfig
from Helpers import CommandFactory
from Helpers.CallWrapper import CallWrapper


class SlackWrapper(object):
    BOT_ID = ''
    SLACK_BOT_TOKEN = ''
    DEBUG = False
    AT_BOT = ""

    # instantiate Slack & Twilio clients
    SLACK_CLIENT = None

    def __init__(self, bot_id, api_token, debug):
        self.BOT_ID = bot_id
        self.SLACK_BOT_TOKEN = api_token
        self.DEBUG = debug
        self.AT_BOT = "<@" + bot_id + ">"
        self.SLACK_CLIENT = SlackClient(api_token)

    def connect(self):
        client = self.SLACK_CLIENT
        debug = self.DEBUG

        if client.rtm_connect():
            now = datetime.datetime.now()
            print("%s/%s/%s %s:%s:%s pinbot connected and running!" % (
                now.month, now.day, now.year, now.hour, now.month, now.second))
            print("DEBUG: " + str(debug))
            while True:
                command, channel = self.__parse_slack_output(client.rtm_read())
                if command and channel:
                    _thread.start_new_thread(self.__handle_command, (command, channel))
                time.sleep(botconfig.READ_WEBSOCKET_DELAY)
        else:
            print("Connection failed. Invalid Slack token or bot ID?")

    def __parse_slack_output(self, slack_rtm_output):
        output_list = slack_rtm_output
        at_bot = self.AT_BOT
        client = self.SLACK_CLIENT
        debug = self.DEBUG

        if output_list and len(output_list) > 0:
            for output in output_list:
                if debug:
                    print(json.dumps(output, indent=4, sort_keys=True))
                if output['type'] == 'message' and 'text' in output and at_bot in output['text']:
                    return output['text'].split(at_bot)[1].strip().lower(), output['channel']
                if output['type'] == 'pin_added':
                    channel_response = CallWrapper(self.SLACK_BOT_TOKEN).get_channel_info(output['item']['channel'])
                    attachments = CallWrapper(self.SLACK_BOT_TOKEN).create_pin_attachment(output['item'], channel_response['channel'])
                    response = client.api_call('chat.postMessage',
                                    channel=output['channel_id'],
                                    attachments=attachments,
                                    as_user=True)
                    if debug:
                        print(json.dumps(response, indent=4, sort_keys=True))
        return None, None

    def __handle_command(self, command, channel):
        client = self.SLACK_CLIENT
        command = CommandFactory.build_command(client, command, channel)

        if command is None:
            return
        else:
            command.execute_command()




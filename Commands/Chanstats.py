import botconfig
import re
import datetime
from datetime import timedelta

from Helpers.CallWrapper import CallWrapper
from Models.Command import Command

class Chanstats(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN
        channel_list = CallWrapper(token).get_channel_list()

        channel_dict = dict()
        for channel in channel_list:
            pins_list = CallWrapper(token).get_pin_list(channel)
            # print("channel ID: {0} pins: {1}".format(channel, pins_list))
            if len(pins_list) >= 95:
                sorted_list = sorted(pins_list, key=lambda pin: pin['created'])

                start_time = datetime.datetime.fromtimestamp(sorted_list[0]['created'])
                end_time = datetime.datetime.fromtimestamp(sorted_list[len(sorted_list) - 1]['created'])
                time_diff = end_time - start_time

                channel_dict[channel['id']] = time_diff
        i = 0
        for channel_id in sorted(channel_dict, key=channel_dict.get, reverse=False):
            i += 1
            channel_info = CallWrapper(token).get_channel_info(channel_id)

            print("{0}. #{1} {2}".format(i, channel_info['channel']['name'], channel_dict[channel_id]))


import botconfig
import re
import datetime
from datetime import timedelta

from Helpers.CallWrapper import CallWrapper
from Models.Command import Command
from Commands.Pinstats import calc_pph


class Chanstats(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN
        channel_list = CallWrapper(token).get_channel_list()

        channel_time_dict = dict()
        pin_list_dict = dict()
        for channel in channel_list:
            pins_list = CallWrapper(token).get_pin_list(channel)
            pin_list_dict[channel['id']] = pins_list
            # print("channel ID: {0} pins: {1}".format(channel, pins_list))
            if len(pins_list) >= 95:
                # sorted_list = sorted(pins_list, key=lambda pin: pin['created'])

                # start_time = datetime.datetime.fromtimestamp(sorted_list[0]['created'])
                # end_time = datetime.datetime.fromtimestamp(sorted_list[len(sorted_list) - 1]['created'])
                start_time = datetime.datetime.fromtimestamp(pins_list[len(pins_list) - 1]['created'])
                end_time = datetime.datetime.fromtimestamp(pins_list[0]['created'])
                time_diff = end_time - start_time

                channel_time_dict[channel['id']] = time_diff

        fast_sorted_channels = sorted(channel_time_dict, key=channel_time_dict.get, reverse=False)
        slow_sorted_channels = sorted(channel_time_dict, key=channel_time_dict.get, reverse=True)
        fastest_field, slowest_field = self.format_chan_fields(fast_sorted_channels[:5], slow_sorted_channels[:5],
                                                               channel_time_dict, pin_list_dict)

        attachments = list()
        message = {
            'mrkdwn_in': ['fields'],
            'fields': list()
        }

        message['fields'].append(fastest_field)
        message['fields'].append(slowest_field)

        attachments.append(message)
        slack_client.api_call('chat.postMessage',
                              channel=self.CHANNEL,
                              attachments=attachments,
                              as_user=True)
        # for channel_id in sorted(channel_dict, key=channel_dict.get, reverse=False):
        #     i += 1
        #     channel_info = CallWrapper(token).get_channel_info(channel_id)
        #
        #     print("{0}. #{1} {2}".format(i, channel_info['channel']['name'], channel_dict[channel_id]))

    def format_chan_fields(self, fastest_chan_list, slowest_chan_list, channel_time_dict, pin_list_dict):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        fastest_field = {
            'title': "Fastest channels:",
            'value': "{0:<29} {1:<21} {2:<4}\n".format("Channel", "Time to Completion", "PPH"),
            'short': False
        }

        slowest_field = {
            'title': "Slowest channels:",
            'value': "{0:<29} {1:<21} {2:<4}\n".format("Channel", "Time to Completion", "PPH"),
            'short': False
        }

        i = 0
        for channel_id in fastest_chan_list:
            i += 1
            channel_info = CallWrapper(token).get_channel_info(channel_id)
            pin_list = pin_list_dict[channel_id]
            # pins_list = CallWrapper(token).get_pin_list(channel_info['channel'])
            # sorted_pins_list = sorted(pins_list, key=lambda pin: pin['created'])
            # start_time, end_time, pph = calc_pph(sorted_pins_list)
            start_time, end_time, pph = calc_pph(pin_list)
            fastest_field['value'] += "{0:1}. #{1:<25} {2:<21} {3:<4.2f}\n".format(i,
                                                                                 channel_info['channel']['name'],
                                                                                 str(channel_time_dict[
                                                                                         channel_id]), pph)
        fastest_field['value'] = "```" + fastest_field['value'] + "```"
        # fastest_field['value'] += "```"

        i = 0
        for channel_id in slowest_chan_list:
            i += 1
            channel_info = CallWrapper(token).get_channel_info(channel_id)
            pin_list = pin_list_dict[channel_id]
            # pins_list = CallWrapper(token).get_pin_list(channel_info['channel'])
            # sorted_pins_list = sorted(pins_list, key=lambda pin: pin['created'])
            # start_time, end_time, pph = calc_pph(sorted_pins_list)
            start_time, end_time, pph = calc_pph(pin_list)
            slowest_field['value'] += "{0}. #{1:<25} {2:<21} {3:<4.2f}\n".format(i,
                                                                                 channel_info['channel']['name'],
                                                                                 str(channel_time_dict[
                                                                                         channel_id]), pph)
        slowest_field['value'] = "```" + slowest_field['value'] + "```"
        # slowest_field['value'] += "```"
        return fastest_field, slowest_field

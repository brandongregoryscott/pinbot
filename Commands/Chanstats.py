import botconfig
import datetime

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
        channel_name_dict = dict()
        pin_list_dict = dict()
        for channel in channel_list:
            pins_list = CallWrapper(token).get_pin_list(channel)
            pin_list_dict[channel['id']] = pins_list

            if len(pins_list) >= 95:
                start_time = datetime.datetime.fromtimestamp(pins_list[len(pins_list) - 1]['created'])
                end_time = datetime.datetime.fromtimestamp(pins_list[0]['created'])
                time_diff = end_time - start_time

                channel_time_dict[channel['id']] = time_diff
                channel_name_dict[channel['id']] = channel['name']

        fast_sorted_channels = sorted(channel_time_dict, key=channel_time_dict.get, reverse=False)
        slow_sorted_channels = sorted(channel_time_dict, key=channel_time_dict.get, reverse=True)

        fastest_field, slowest_field = self.format_chan_fields(fast_sorted_channels[:5], slow_sorted_channels[:5],
                                                               channel_name_dict, pin_list_dict)

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

    def format_chan_fields(self, fastest_chan_list, slowest_chan_list, channel_name_dict, pin_list_dict):
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
            pin_list = pin_list_dict[channel_id]
            start_time, end_time, pph = calc_pph(pin_list)
            fastest_field['value'] += "{0:1}. #{1:<25} {2:<21} {3:<4.2f}\n".format(i,
                                                                                   channel_name_dict[channel_id],
                                                                                   str(end_time - start_time), pph)
        fastest_field['value'] = "```" + fastest_field['value'] + "```"

        i = 0
        for channel_id in slowest_chan_list:
            i += 1
            pin_list = pin_list_dict[channel_id]
            start_time, end_time, pph = calc_pph(pin_list)
            slowest_field['value'] += "{0}. #{1:<25} {2:<21} {3:<4.2f}\n".format(i,
                                                                                 channel_name_dict[channel_id],
                                                                                 str(end_time - start_time), pph)
        slowest_field['value'] = "```" + slowest_field['value'] + "```"

        return fastest_field, slowest_field

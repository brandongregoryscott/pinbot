import botconfig
import datetime

from Helpers.CallWrapper import CallWrapper
from Models.Command import Command
from Commands import Pinstats


class Chanstats(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        channel_list = CallWrapper(token).get_channel_list()

        time = dict()
        channel_dict = dict()
        for channel in channel_list:
            channel_dict[channel['id']] = dict()
            pins_list = CallWrapper(token).get_pin_list(channel)

            if len(pins_list) >= 95:
                start_time, end_time, pph, hours = Pinstats.calc_pph(pins_list)
                time[channel['id']] = hours
                channel_dict[channel['id']]['hours'] = hours
                channel_dict[channel['id']]['pph'] = pph
                channel_dict[channel['id']]['name'] = channel['name']

        fast_sorted_channels = sorted(time, key=time.get, reverse=False)
        slow_sorted_channels = sorted(time, key=time.get, reverse=True)

        fastest_field, slowest_field = self.format_chan_fields(fast_sorted_channels[:5], slow_sorted_channels[:5],
                                                               channel_dict)

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

    def format_chan_fields(self, fastest_chan_list, slowest_chan_list, channel_dict):
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
            name = channel_dict[channel_id]['name']
            pph = channel_dict[channel_id]['pph']
            hours = channel_dict[channel_id]['hours']
            fastest_field['value'] += "{0:1}. #{1:<25} {2:<2}{3:<18} {4:<4.2f}\n".format(i, name, int(hours), " hours", pph)
        fastest_field['value'] = "```" + fastest_field['value'] + "```"

        i = 0
        for channel_id in slowest_chan_list:
            i += 1
            name = channel_dict[channel_id]['name']
            pph = channel_dict[channel_id]['pph']
            hours = channel_dict[channel_id]['hours']
            slowest_field['value'] += "{0}. #{1:<25} {2:<3}{3:<18} {4:<4.2f}\n".format(i, name, int(hours), " hours", pph)
        slowest_field['value'] = "```" + slowest_field['value'] + "```"

        return fastest_field, slowest_field

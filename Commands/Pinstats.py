import botconfig
import re
import datetime
from datetime import timedelta
from Models.Command import Command
from Helpers.CallWrapper import CallWrapper


def calc_pph(sorted_pin_list):
    end_time = datetime.datetime.fromtimestamp(sorted_pin_list[0]['created'])
    start_time = datetime.datetime.fromtimestamp(sorted_pin_list[len(sorted_pin_list) - 1]['created'])
    time_diff = end_time - start_time

    # Calculate the hours from the starting day by finding the time diff of the first pin & 5 PM
    hours = ((start_time.replace(hour=17) - start_time).seconds / 60 / 60)

    # Take 8 hours of each weekday from (start + 1 .. end - 1)
    for single_date in (start_time + timedelta(days=n) for n in range(1, time_diff.days)):
        if single_date.isoweekday() in range(0, 5):
            hours += 8

    # Add on any extra hours from the end day via the seconds field
    hours += (time_diff.seconds / 60 / 60)

    # Calculate PPH
    pph = len(sorted_pin_list) / hours

    # If the channel is not complete, set end_time null
    if len(sorted_pin_list) < 95:
        end_time = None
    return start_time, end_time, pph, hours


def count_pins(pins_list):
    pin_count_today = 0
    pin_counts = dict()
    pinner_counts = dict()
    for pin in pins_list:
        pin_timestamp = datetime.datetime.fromtimestamp(pin['created'])
        if pin_timestamp.date() == datetime.datetime.today().date():
            pin_count_today += 1

        pin_type = pin['type']
        if pin[pin_type]['user'] not in pin_counts.keys():
            pin_counts[pin[pin_type]['user']] = 0
        pin_counts[pin[pin_type]['user']] += 1

        if pin['created_by'] not in pinner_counts.keys():
            pinner_counts[pin['created_by']] = 0
        pinner_counts[pin['created_by']] += 1

    return pin_count_today, pin_counts, pinner_counts


class Pinstats(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)
        self.STAT_CHANNEL = None

    def parse_arguments(self):
        token = botconfig.SLACK_BOT_TOKEN
        command_text = self.COMMAND_TEXT
        stat_channel = None
        channel_pattern = re.compile("<#[a-zA-Z0-9]*\|[0-9]+[a-zA-Z_]*>")
        group_pattern = re.compile("#[a-zA-Z0-9_]+")

        if command_text.count(' ') == 0:
            if channel_pattern.match(command_text.split(' ')[0]):
                stat_channel = command_text.split('#')[1].split('|')[0]
            elif group_pattern.match(command_text.split(' ')[0]):
                stat_channel = CallWrapper(token).get_channel_info_by_name(command_text.split('#')[1])['id']

        if stat_channel is not None:
            self.STAT_CHANNEL = stat_channel.upper()
        else:
            self.STAT_CHANNEL = self.CHANNEL

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        # Parse the channel, if given
        self.parse_arguments()

        # Grab the list of pins for this channel from the Slack API
        channel_info = CallWrapper(token).get_channel_info(self.STAT_CHANNEL)
        pins_list = CallWrapper(token).get_pin_list(channel_info['channel'])

        pin_count_today, pin_counts, pinner_counts = count_pins(pins_list)
        pinned_field, pinners_field = self.format_pin_fields(pin_counts, pinner_counts)
        start_time, end_time, pph, hours = calc_pph(pins_list)
        stats_field = self.format_stats_field(channel_info, start_time, end_time, pph, pin_count_today)

        attachments = list()
        message = {
            'fields': list()
        }

        message['fields'].append(pinned_field)
        message['fields'].append(pinners_field)
        message['fields'].append(stats_field)

        attachments.append(message)
        slack_client.api_call('chat.postMessage',
                              channel=self.CHANNEL,
                              attachments=attachments,
                              as_user=True)

    def format_pin_fields(self, pin_counts, pinner_counts):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        pinned_field = {
            'title': "Top pinned:",
            'value': "",
            'short': True
        }
        pinners_field = {
            'title': "Top pinners:",
            'value': "",
            'short': True
        }

        i = 0
        for user_id in sorted(pin_counts, key=pin_counts.get, reverse=True):
            i += 1
            user_json = slack_client.api_call("users.info", token=token, user=user_id)
            user = user_json['user']
            pinned_field['value'] += "{0}. {1}: {2} {3}".format(i, user['name'], pin_counts[user_id], "messages\n")
        i = 0
        for user_id in sorted(pinner_counts, key=pinner_counts.get, reverse=True):
            i += 1
            user_json = slack_client.api_call("users.info", token=token, user=user_id)
            user = user_json['user']
            pinners_field['value'] += "{0}. {1}: {2} {3}".format(i, user['name'], pinner_counts[user_id], "pins\n")

        return pinned_field, pinners_field

    def format_stats_field(self, channel_info, start_time, end_time, pph, pin_count_today):
        stats_field = {
            'title': "Pinstats for #{0}:".format(channel_info['channel']['name']),
            'value': "",
            'short': False
        }

        stats_field['value'] += "Pinstart: {0}\n".format(start_time.strftime("%m/%d/%y %I:%M:%S %p"))
        if end_time is not None:
            stats_field['value'] += "Pinend: {0}\n".format(end_time.strftime("%m/%d/%y %I:%M:%S %p"))
            stats_field['value'] += "Time to completion: {0}\n".format(end_time - start_time)
        stats_field['value'] += "PPH: {0:.2f}\n".format(pph)
        stats_field['value'] += "Pins today: {0}\n".format(pin_count_today)
        return stats_field

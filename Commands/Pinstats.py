import botconfig
import re
import datetime
from datetime import timedelta
from Models.Command import Command


def count_pins(channel):
    pass


class Pinstats(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)
        self.channel = None
        self.date = None
        self.command = None

    def parse_arguments(self):
        date = None
        channel = None
        command = None
        command_text = self.COMMAND_TEXT
        date_pattern = re.compile("(today)|(yesterday)|([0-9]{1,2}/[0-9]{1,2}(/[0-9]{2})?)")
        channel_pattern = re.compile("<#[a-zA-Z0-9]*\|[0-9]+[a-zA-Z_]*>")
        command_pattern = re.compile("(users)|(channels)|(words)")

        if command_text.count(' ') == 0:
            if date_pattern.match(command_text.split(' ')[0]):
                date = command_text.split(' ')[0]
                channel = self.CHANNEL
            elif channel_pattern.match(command_text.split(' ')[0]):
                # date = datetime.datetime.today().strftime("%m/%d/%y")
                channel = command_text.split('#')[1].split('|')[0]
            elif command_pattern.match(command_text.split(' ')[0]):
                command = command_text.split(' ')[0]

        elif command_text.count(' ') == 1:
            if channel_pattern.match(command_text.split(' ')[0]) and date_pattern.match(command_text.split(' ')[1]):
                channel = command_text.split('#')[1].split('|')[0]
                date = command_text.split(' ')[1]

        if date is not None:
            if date == 'today':
                date = datetime.datetime.today().strftime("%m/%d/%y")
            elif date == 'yesterday':
                date = datetime.datetime.today() - timedelta(days=1)
                date = date.strftime("%m/%d/%y")

        self.channel = channel.upper()
        self.date = date
        self.command = command

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        self.parse_arguments()

        if self.command is None:
            self.pinstats()

    def pinstats(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        # Grab the list of pins for this channel from the Slack API
        pins_json = slack_client.api_call("pins.list", token=token, channel=self.channel)
        pins_list = pins_json['items']

        pin_counts, pinner_counts = self.count_pins(pins_list)
        pinned_field, pinners_field = self.format_pin_fields(pin_counts, pinner_counts)
        stats_field = self.format_stats_field(pins_list)

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

    def count_pins(self, pins_list):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        pin_counts = dict()
        pinner_counts = dict()
        for pin in pins_list:
            pin_type = pin['type']
            if pin[pin_type]['user'] not in pin_counts.keys():
                pin_counts[pin[pin_type]['user']] = 0
            pin_counts[pin[pin_type]['user']] += 1

            if pin['created_by'] not in pinner_counts.keys():
                pinner_counts[pin['created_by']] = 0
            pinner_counts[pin['created_by']] += 1

        return pin_counts, pinner_counts

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
            pinned_field['value'] += "{0}{1}{2}{3}{4}{5}".format(i, ". ", user['name'], ": ", pin_counts[user_id],
                                                                 " messages\n")
        i = 0
        for user_id in sorted(pinner_counts, key=pinner_counts.get, reverse=True):
            i += 1
            user_json = slack_client.api_call("users.info", token=token, user=user_id)
            user = user_json['user']
            pinners_field['value'] += "{0}{1}{2}{3}{4}{5}".format(i, ". ", user['name'], ": ", pinner_counts[user_id],
                                                                  " pins\n")

        return pinned_field, pinners_field

    def format_stats_field(self, pins_list):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN

        sorted_list = sorted(pins_list, key=lambda pin: pin['created'])
        channel_info = slack_client.api_call('channels.info', channel=sorted_list[0]['channel'])
        stats_field = {
            'title': "Pinstats for #{0}:".format(channel_info['channel']['name']),
            'value': "",
            'short': False
        }
        start_time = datetime.datetime.fromtimestamp(sorted_list[0]['created'])
        end_time = datetime.datetime.fromtimestamp(sorted_list[len(sorted_list) - 1]['created'])
        time_diff = end_time - start_time
        print("time diff: {0}".format(time_diff))
        hours = time_diff.days * 8
        if hours == 0:
            hours = time_diff.seconds / 60 / 60
        pph = len(sorted_list) / hours
        stats_field['value'] += "Pinstart: {0}\n".format(start_time.strftime("%m/%d/%y %I:%M:%S %p"))
        if len(sorted_list) == 100:
            stats_field['value'] += "Pinend: {0}\n".format(end_time.strftime("%m/%d/%y %I:%M:%S %p"))
            stats_field['value'] += "Time to completion: {0}\n".format(time_diff)
        stats_field['value'] += "PPH: {0:.2f}\n".format(pph)
        return stats_field
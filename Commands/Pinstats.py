import botconfig
import re
import datetime
from Models.Command import Command


class Pinstats(Command):
    channel = None
    date = None
    command = None

    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def parse_arguments(self):
        command_text = self.COMMAND_TEXT

        if command_text.count(' ') == 0:
            date_pattern = re.compile("(today)|(yesterday)|([0-9]{1,2}/[0-9]{1,2}(/[0-9]{2})?)")
            # channel_pattern = re.compile("#[0-9]+[a-zA-Z_]*")
            channel_pattern = re.compile("<#[a-zA-Z0-9]*\|[0-9]+[a-zA-Z_]*>")

            if date_pattern.match(command_text.split(' ')[0]):
                date = command_text.split(' ')[0]
                channel = self.CHANNEL
            elif channel_pattern.match(command_text.split(' ')[0]):
                date = datetime.datetime.today().strftime("%m/%d/%y")
                channel = command_text.split('#')[1].split('|')[0]

            print("date: {0} channel: {1}".format(date, channel))

    def execute_command(self):
        slack_client = self.CLIENT
        token = botconfig.SLACK_BOT_TOKEN
        # channel = self.CHANNEL

        # print("Pinstats command: {0} {1}".format(self.COMMAND_HEAD, self.COMMAND_TEXT))
        # print("self.COMMAND_TEXT.count(' '): {0}".format(self.COMMAND_TEXT.count(' ')))

        self.parse_arguments()

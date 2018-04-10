import botconfig
import random

from Models.Command import Command
from Commands.Random import Random


class Story(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        for i in range(random.randint(3, 4)):
            Random(self.CLIENT, self.COMMAND_HEAD, self.COMMAND_TEXT, self.CHANNEL).execute_command()

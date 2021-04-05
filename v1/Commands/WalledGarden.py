import botconfig
import random
from Models.Command import Command


class WalledGarden(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        template = random.choice(botconfig.WG_TEMPLATES)
        self.post_message(template.format(self.COMMAND_TEXT))

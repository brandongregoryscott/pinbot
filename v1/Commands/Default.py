import botconfig
from Models.Command import Command


class Default(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        self.post_message(botconfig.COMMAND_RESPONSE.format(self.COMMAND_HEAD))

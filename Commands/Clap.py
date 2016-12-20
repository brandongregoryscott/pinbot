import botconfig
from Models.Command import Command


class Clap(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        command = self.COMMAND_TEXT
        while command.endswith(" "):
            command = command[:-1]
        self.post_message(command.replace(" ", " :clap: ").upper())

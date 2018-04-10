from Models.Command import Command
from Commands.Random import Random


class RandomImage(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        slack_client = self.CLIENT
        channel = self.CHANNEL

        random_command = Random(self.CLIENT, self.COMMAND_HEAD, self.COMMAND_TEXT, self.CHANNEL)
        random_pin, random_channel = random_command.get_random_pin('file')

        attachment = random_command.create_attachment(random_pin, random_channel)

        slack_client.api_call('chat.postMessage',
                              channel=channel,
                              attachments=attachment,
                              as_user=True)

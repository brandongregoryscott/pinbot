class Command(object):
    CLIENT = None
    COMMAND_HEAD = ""
    COMMAND_TEXT = ""
    CHANNEL = ""

    def __init__(self, client, command_head, command_text, channel):
        self.CLIENT = client
        self.COMMAND_HEAD = command_head
        self.COMMAND_TEXT = command_text
        self.CHANNEL = channel

    def execute_command(self):
        raise NotImplementedError("Should have implemented this")

    def post_message(self, message):
        client = self.CLIENT
        channel = self.CHANNEL
        client.api_call("chat.postMessage",
                        channel=channel,
                        text=message,
                        as_user=True)

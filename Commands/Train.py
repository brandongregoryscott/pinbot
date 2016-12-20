import random
import time

from Models.Command import Command


class Train(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        client = self.CLIENT
        channel = self.CHANNEL
        emoji = self.COMMAND_TEXT

        # Next, we post the initial :train: message that we will be appending our emojis onto
        response = client.api_call("chat.postMessage", channel=channel, text=':train:', as_user=True)

        post_text = " :train:"

        # next, we generate a random number between 5 and 10, and append the emoji
        # that many times to the head of the string
        for i in range(random.randint(5, 10)):
            time.sleep(1)
            post_text = " " + emoji + post_text
            client.api_call("chat.update", channel=channel, ts=response['ts'], text=post_text, as_user=True)

import os
import time
from slackclient import SlackClient

BOT_ID = os.environ.get("BOT_ID")

# constants
AT_BOT = "<@" + BOT_ID + ">"
EXAMPLE_COMMAND = "do"
COMMANDS = ["vaporwave"]

# instantiate Slack & Twilio clients
slack_client = SlackClient(os.environ.get('SLACK_BOT_TOKEN'))

def get_wide_text(command, channel):
    return_string = ""
    for x in command:
        if not (command.startsWith(COMMANDS[0]))
            return_string += x
    return return_string.replace("", " ")


def get_response(command, channel):
    return {
        COMMANDS[0]: get_wide_text(command, channel)
    }.get(command.split(' ', 1)[0], "Write some more code to handle *" +command.split(' ', 1)[0]+ "*  homie!")


def handle_command(command, channel):
    response = get_response(command, channel)
    
    slack_client.api_call("chat.postMessage", channel=channel,
                          text=response, as_user=True)


def parse_slack_output(slack_rtm_output):
    output_list = slack_rtm_output
    if output_list and len(output_list) > 0:
        for output in output_list:
            if output['type'] == 'message' and 'subtype' in output and output['subtype'] == 'pinned_item':
                print("Pinned item")
                slack_client.api_call('chat.postMessage',
                    channel=output['channel'],
                    attachments=output['attachments'],
                    as_user=True)
    return None, None

if __name__ == "__main__":
    READ_WEBSOCKET_DELAY = 1 # 1 second delay between reading from firehose
    if slack_client.rtm_connect():
        print("pinbot connected and running!")
        while True:
            command, channel = parse_slack_output(slack_client.rtm_read())
            if command and channel:
                handle_command(command, channel)
            time.sleep(READ_WEBSOCKET_DELAY)
    else:
        print("Connection failed. Invalid Slack token or bot ID?")

import os
import time
from slackclient import SlackClient

BOT_ID = os.environ.get("BOT_ID")

# constants
AT_BOT = "<@" + BOT_ID + ">"
COMMAND_RESPONSE = "Write some more code to handle *{0}* homie!"

# array containing all commands that pinbot can use
COMMANDS = ["vaporwave"]

# instantiate Slack & Twilio clients
slack_client = SlackClient(os.environ.get('SLACK_BOT_TOKEN'))

def get_wide_text(command):
    # This is a character array containing the normal, unchanged characters
    normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!#$%&\'()*+-.,/:;<>@=?[]{}~|_'
    # This character array is the wide-text mapping for the normal characters
    wide = '\uFF41\uFF42\uFF43\uFF44\uFF45\uFF46\uFF47\uFF48\uFF49\uFF4A\uFF4B\uFF4C\uFF4D\uFF4E\uFF4F\uFF50\uFF51\uFF52\uFF53\uFF54\uFF55\uFF56\uFF57\uFF58\uFF59\uFF5A\uFF21\uFF22\uFF23\uFF24\uFF25\uFF26\uFF27\uFF28\uFF29\uFF2A\uFF2B\uFF2C\uFF2D\uFF2E\uFF2F\uFF30\uFF31\uFF32\uFF33\uFF34\uFF35\uFF36\uFF37\uFF38\uFF39\uFF3A \uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19\uFF01\uFF03\uFF04\uFF05\uFF06\uFF07\uFF08\uFF09\uFF0A\uFF0B\uFF0D\uFF0E\uFF0C\uFF0F\uFF1A\uFF1B\uFF1C\uFF1E\uFF20\uFF1D\uFF1F\uFF3B\uFF3D\uFF5B\uFF5D\uFF5E\uFF5C\uFF3F'

    # Before we begin converting to widetext, strip out the first occurrence of
    # the command (and the following space)
    remainingText = command.replace(COMMANDS[0] + " ", "", 1)
    wideText = '';

    # Loop over the remaining text and add the corresponding wide character to
    # the output string
    for char in remainingText:
        wideText += wide[normal.index(char)]
    return wideText

def get_response(command):
    command_head = command.split(" ", 1)[0]
    return {
        COMMANDS[0]: get_wide_text(command)
    }.get(command_head, COMMAND_RESPONSE.format(command_head))


def handle_command(command, channel):
    response = get_response(command)
    slack_client.api_call("chat.postMessage", channel=channel,
                          text=response, as_user=True)


def parse_slack_output(slack_rtm_output):
    output_list = slack_rtm_output
    if output_list and len(output_list) > 0:
        for output in output_list:
            if output['type'] == 'message' and 'text' in output and AT_BOT in output['text']:
                return output['text'].split(AT_BOT)[1].strip().lower(), output['channel']
            if output['type'] == 'message' and 'subtype' in output and output['subtype'] == 'pinned_item':
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

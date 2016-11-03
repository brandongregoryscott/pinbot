import os
import time
import random
from slackclient import SlackClient

BOT_ID = os.environ.get("BOT_ID")
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")

# constants
AT_BOT = "<@" + BOT_ID + ">"
COMMAND_RESPONSE = "Write some more code to handle *{0}* homie!"

# array containing all commands that pinbot can use
COMMANDS = ["vaporwave", ":train:", "random"]

# instantiate Slack & Twilio clients
slack_client = SlackClient(SLACK_BOT_TOKEN)

def random_pin(channel):
    # First, we need to grab both the channels (public) and groups (private)
    # from the Slack API
    channels_json = slack_client.api_call("channels.list", token=SLACK_BOT_TOKEN)
    groups_json = slack_client.api_call("groups.list", token=SLACK_BOT_TOKEN)
    # Extract the individual channels & group JSON Arrays from the responses
    channel_list = channels_json['channels'] + groups_json['groups']

    # Now, we will choose a random 'sadbois' channel
    chosen_channel = None
    while chosen_channel == None:
        random_channel = random.choice(channel_list)
        if (random_channel['name'].startswith("sadbois")):
            chosen_channel = random_channel

    # Grab the list of pins for this channel from the Slack API
    pins_json = slack_client.api_call("pins.list", token=SLACK_BOT_TOKEN, channel=random_channel['id'])
    pins_list = pins_json['items']

    # Select a random pin from the list
    random_pin = random.choice(pins_list)

    # For right now, we'll only pick from text pins
    while (random_pin['type'] != 'message'):
        random_pin = random.choice(pins_list)

    message = random_pin['message']

    # Grab information about the posting user from the Slack API
    user_json = slack_client.api_call("users.info", token=SLACK_BOT_TOKEN, user=message['user'])
    user = user_json['user']

    # The user's 'profile' JSON object contains more specific info about them
    # https://api.slack.com/methods/users.info
    poster = user['profile']

    # Create an array to hold the attachment object
    attachment = []

    # This attachment object will contain only one pin object
    pin_object = {}

    # Parse out the pertinent data from the objects obtained earlier
    # This ensures proper formatting for the shared pin
    pin_object['from_url'] = message['permalink']
    pin_object['channel_id'] = message['pinned_to']
    pin_object['text'] = message['text']
    pin_object['author_icon'] = poster['image_32']
    pin_object['author_name'] = user['name']
    pin_object['author_link'] = message['permalink']
    pin_object['channel_name'] = random_channel['name']
    pin_object['color'] = "D0D0D0"
    pin_object['ts'] = message['ts']
    pin_object['mrkdwn_in'] = ['text']
    pin_object['footer'] = "Posted in " + random_channel['name']
    pin_object['is_share'] = True
    pin_object['is_msg_unfurl'] = True

    # Finally, append this pin object to the attachment array and post it
    attachment.append(pin_object)
    slack_client.api_call('chat.postMessage',
                          channel=channel,
                          attachments=attachment,
                          as_user=True)
    return None

def get_wide_text(command):
    # This is a character array containing the normal, unchanged characters
    normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!#$%&\'()*+-.,/:;<>@=?[]{}~|_'
    # This character array is the wide-text mapping for the normal characters
    wide = '\uFF41\uFF42\uFF43\uFF44\uFF45\uFF46\uFF47\uFF48\uFF49\uFF4A\uFF4B\uFF4C\uFF4D\uFF4E\uFF4F\uFF50\uFF51\uFF52\uFF53\uFF54\uFF55\uFF56\uFF57\uFF58\uFF59\uFF5A\uFF21\uFF22\uFF23\uFF24\uFF25\uFF26\uFF27\uFF28\uFF29\uFF2A\uFF2B\uFF2C\uFF2D\uFF2E\uFF2F\uFF30\uFF31\uFF32\uFF33\uFF34\uFF35\uFF36\uFF37\uFF38\uFF39\uFF3A \uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19\uFF01\uFF03\uFF04\uFF05\uFF06\uFF07\uFF08\uFF09\uFF0A\uFF0B\uFF0D\uFF0E\uFF0C\uFF0F\uFF1A\uFF1B\uFF1C\uFF1E\uFF20\uFF1D\uFF1F\uFF3B\uFF3D\uFF5B\uFF5D\uFF5E\uFF5C\uFF3F'
    # This character array is for all of the special characters we want the wide-text processor to ignore
    special = '`_*~>'
    # Before we begin converting to widetext, strip out the first occurrence of
    # the command (and the following space)
    remaining_text = command.replace(COMMANDS[0] + " ", "", 1)
    wide_text = ''

    # Loop over the remaining text and add the corresponding wide character to
    # the output string
    for char in remaining_text:
        if char in special:
            wide_text += char
        else:
            wide_text += wide[normal.index(char)]
    return wide_text


def get_emoji_string(count, emoji):
    i = count
    formatted_emoji = " "+emoji+" "
    return_string = ''
    while i > 0:
        return_string += formatted_emoji
        i-=1
    return return_string


def post_train(command, channel):
    emoji = command.split(" ")[1]
    emoji_count = random.randrange(5, 10, 1)
    current_count = 1
    response = slack_client.api_call("chat.postMessage", channel=channel,
                                     text=':train:', as_user=True)
    while emoji_count >= current_count:
        time.sleep(1)
        update_text = get_emoji_string(current_count, emoji) + ':train:'
        update_response = slack_client.api_call("chat.update", channel=channel,
                              ts=response['ts'], text=update_text, as_user=True)
        current_count += 1

    return None


def get_response(command_head, channel):
    if command_head == COMMANDS[0]:
        return get_wide_text(command)
    elif command_head == COMMANDS[1]:
        return post_train(command, channel)
    elif command_head == COMMANDS[2]:
        return random_pin(channel)
    else:
        return COMMAND_RESPONSE.format(command_head)


def handle_command(command, channel):
    command_head = command.split(" ", 1)[0]
    response = get_response(command_head, channel)
    if response is None:
        return
    slack_client.api_call("chat.postMessage", channel=channel,
                          text=response, as_user=True)


def parse_slack_output(slack_rtm_output):
    output_list = slack_rtm_output
    if output_list and len(output_list) > 0:
        for output in output_list:
            print(output)
            if output['type'] == 'message' and 'text' in output and AT_BOT in output['text']:
                return output['text'].split(AT_BOT)[1].strip().lower(), output['channel']
            if output['type'] == 'message' and 'subtype' in output and output['subtype'] == 'pinned_item':
                slack_client.api_call('chat.postMessage',
                                      channel=output['channel'],
                                      attachments=output['attachments'],
                                      as_user=True)
    return None, None


if __name__ == "__main__":
    READ_WEBSOCKET_DELAY = 1  # 1 second delay between reading from firehose
    if slack_client.rtm_connect():
        print("pinbot connected and running!")
        while True:
            command, channel = parse_slack_output(slack_client.rtm_read())
            if command and channel:
                handle_command(command, channel)
            time.sleep(READ_WEBSOCKET_DELAY)
    else:
        print("Connection failed. Invalid Slack token or bot ID?")

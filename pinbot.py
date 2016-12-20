import sys
import getopt
import botconfig
from Helpers.SlackWrapper import SlackWrapper


# Boolean for printing debugging output
DEBUG = False


def print_help():
    print("python3 pinbot.py Starts pinbot normally without any extra configuration.")
    print("python3 pinbot.py [-h | --help] Prints help info from slack client.")
    print("python3 pinbot.py [-d | --debug] Prints all output from slack client.")


def handle_args(argv):
    print("-----------------------")
    try:
        opts, args = getopt.getopt(argv, "hd", ["help", "debug"])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)
    for opt, arg in opts:
        if opt in ("-h", "--help"):
            print_help()
            sys.exit(2)
        elif opt in ("-d", "--debug"):
            global DEBUG
            DEBUG = True


def main(argv):
    handle_args(argv)
    slack = SlackWrapper(botconfig.BOT_ID, botconfig.SLACK_BOT_TOKEN, DEBUG)
    slack.connect()

if __name__ == "__main__":
    main(sys.argv[1:])

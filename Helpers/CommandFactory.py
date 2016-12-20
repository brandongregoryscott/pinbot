from Commands.Default import Default
from Commands.Train import Train
from Commands.Vaporwave import Vaporwave
from Commands.Random import Random
from Commands.Clap import Clap
from Commands.LulWall import LulWall
from Commands.WalledGarden import WalledGarden

# array containing all commands that pinbot can use
COMMANDS = ["vaporwave", ":train:", "random", "wall", "build", "lul", "clap", "wg"]


def valid(command):
    return command in COMMANDS


def build_command(client, command, channel):
    command_head = command.split(" ", 1)[0]
    command_text = command.replace(command_head + " ", "", 1)
    if command_head == COMMANDS[0]:
        return Vaporwave(client, command_head, command_text, channel)
    elif command_head == COMMANDS[1]:
        return Train(client, command_head, command_text, channel)
    elif command_head == COMMANDS[2]:
        return Random(client, command_head, command_text, channel)
    elif command_head == COMMANDS[3] or command_head == COMMANDS[4] or command_head == COMMANDS[5]:
        return LulWall(client, command_head, command_text, channel)
    elif command_head == COMMANDS[6]:
        return Clap(client, command_head, command_text, channel)
    elif command_head == COMMANDS[7]:
        return WalledGarden(client, command_head, command_text, channel)
    else:
        return Default(client, command_head, command_text, channel)



from Commands.Default import Default
from Commands.Train import Train
from Commands.Vaporwave import Vaporwave
from Commands.Random import Random
from Commands.Clap import Clap
from Commands.LulWall import LulWall
from Commands.WalledGarden import WalledGarden
from Commands.Pinstats import Pinstats

# arrays containing all commands that pinbot can use

VAPORWAVE_COMMANDS = ["vw", "vaporwave", "vapor"]
TRAIN_COMMANDS = ["train", ":train:"]
RANDOM_COMMANDS = ["r", "rand", "random"]
LULWALL_COMMANDS = ["lul", "wall", "build"]
CLAP_COMMANDS = ["clap", ":clap:"]
WG_COMMANDS = ["wg", "walledgarden", "2016"]
PINSTATS_COMMANDS = ["ps", "stats", "pinstats"]

def build_command(client, command, channel):
    command_head = command.split(" ", 1)[0]
    command_text = command.replace(command_head + " ", "", 1)
    if command_head in VAPORWAVE_COMMANDS:
        return Vaporwave(client, command_head, command_text, channel)
    elif command_head in TRAIN_COMMANDS:
        return Train(client, command_head, command_text, channel)
    elif command_head in RANDOM_COMMANDS:
        return Random(client, command_head, command_text, channel)
    elif command_head in LULWALL_COMMANDS:
        return LulWall(client, command_head, command_text, channel)
    elif command_head in CLAP_COMMANDS:
        return Clap(client, command_head, command_text, channel)
    elif command_head in WG_COMMANDS:
        return WalledGarden(client, command_head, command_text, channel)
    elif command_head in PINSTATS_COMMANDS:
        return Pinstats(client, command_head, command_text, channel)
    else:
        return Default(client, command_head, command_text, channel)



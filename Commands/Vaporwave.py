import random
import time

from Models.Command import Command


class Vaporwave(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        # This is a character array containing the normal, unchanged characters
        normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!#$%&\'()*+-.,/:;<>@=?[]{}~|_'
        # This character array is the wide-text mapping for the normal characters
        wide = '\uFF41\uFF42\uFF43\uFF44\uFF45\uFF46\uFF47\uFF48\uFF49\uFF4A\uFF4B\uFF4C\uFF4D\uFF4E\uFF4F\uFF50\uFF51\uFF52\uFF53\uFF54\uFF55\uFF56\uFF57\uFF58\uFF59\uFF5A\uFF21\uFF22\uFF23\uFF24\uFF25\uFF26\uFF27\uFF28\uFF29\uFF2A\uFF2B\uFF2C\uFF2D\uFF2E\uFF2F\uFF30\uFF31\uFF32\uFF33\uFF34\uFF35\uFF36\uFF37\uFF38\uFF39\uFF3A \uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19\uFF01\uFF03\uFF04\uFF05\uFF06\uFF07\uFF08\uFF09\uFF0A\uFF0B\uFF0D\uFF0E\uFF0C\uFF0F\uFF1A\uFF1B\uFF1C\uFF1E\uFF20\uFF1D\uFF1F\uFF3B\uFF3D\uFF5B\uFF5D\uFF5E\uFF5C\uFF3F'
        # This character array is for all of the special characters we want the wide-text processor to ignore
        special = '`_*~>'
        # Before we begin converting to widetext, strip out the first occurrence of
        # the command (and the following space)
        remaining_text = self.COMMAND_TEXT
        wide_text = ''

        # Loop over the remaining text and add the corresponding wide character to
        # the output string
        for char in remaining_text:
            if char in special:
                wide_text += char
            else:
                wide_text += wide[normal.index(char)]
        self.post_message(wide_text)

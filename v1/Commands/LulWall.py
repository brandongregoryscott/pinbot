from Models.Command import Command


class LulWall(Command):
    def __init__(self, client, command_head, command_text, channel):
        Command.__init__(self, client, command_head, command_text, channel)

    def execute_command(self):
        lul_wall_text = ""
        for i in range(297):
            lul_wall_text += ":lul: "
        self.post_message(lul_wall_text)

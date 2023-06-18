import { SlackBotWorker } from "botbuilder-adapter-slack";
import { BotkitMessage } from "botkit";

interface SlackBotkitHandler {
    (bot: SlackBotWorker, message: BotkitMessage): Promise<any>;
}

export { SlackBotkitHandler };

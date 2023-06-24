import type { SlackBotWorker } from "botbuilder-adapter-slack";
import type { BotkitMessage } from "botkit";

interface SlackBotkitHandler {
    (bot: SlackBotWorker, message: BotkitMessage): Promise<unknown>;
}

export type { SlackBotkitHandler };

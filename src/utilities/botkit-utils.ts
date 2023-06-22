import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage, BotWorker } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { Md, Message } from "slack-block-builder";
import { isError } from "lodash";

const hears = (
    patterns: string | RegExp,
    events: string | string[],
    handler: SlackBotkitHandler
) => (controller: Botkit) =>
    controller.hears(patterns, events, safeHandler(handler));

const on = (events: string | string[], handler: SlackBotkitHandler) => (
    controller: Botkit
) => controller.on(events, safeHandler(handler));

const safeHandler = (handler: SlackBotkitHandler) => async (
    bot: BotWorker,
    message: BotkitMessage
) => {
    try {
        await handler(bot as SlackBotWorker, message);
    } catch (error) {
        const text = isError(error)
            ? error.message
            : JSON.stringify(error, undefined, 4);
        await bot.say(
            Message({ text: `Error:\n${Md.codeBlock(text)}` }).buildToObject()
        );
    }
};

export { on, hears };

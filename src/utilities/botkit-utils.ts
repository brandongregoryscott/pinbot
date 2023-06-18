import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage, BotWorker } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { StringUtils } from "./string-utils";

const BotkitUtils = {
    hears(
        controller: Botkit,
        patterns: string | RegExp,
        events: string | string[],
        handler: SlackBotkitHandler
    ) {
        return controller.hears(patterns, events, this.tryCatch(handler));
    },
    on(
        controller: Botkit,
        events: string | string[],
        handler: SlackBotkitHandler
    ) {
        return controller.on(events, this.tryCatch(handler));
    },
    tryCatch(handler: SlackBotkitHandler) {
        return async (bot: BotWorker, message: BotkitMessage) => {
            try {
                await handler(bot as SlackBotWorker, message);
            } catch (error) {
                if (!(error instanceof Error)) {
                    console.log(
                        `Unexpected error type: ${typeof error}`,
                        error
                    );
                    return;
                }

                console.log(error);
                const errorAsJson = JSON.stringify(error, undefined, 4);
                const formattedError =
                    errorAsJson !== "{}" ? errorAsJson : error.toString();
                await bot.say(
                    `Error: ${StringUtils.formatCodeBlock(formattedError)}`
                );
            }
        };
    },
};

export { BotkitUtils };

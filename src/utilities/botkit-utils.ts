import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage, BotWorker } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { StringUtils } from "./string-utils";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

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
                await bot.say(
                    `Error: ${StringUtils.formatCodeBlock(
                        JSON.stringify(error, undefined, 4)
                    )}`
                );
            }
        };
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { BotkitUtils };

// #endregion Exports

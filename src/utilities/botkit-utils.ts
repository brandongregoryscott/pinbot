import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage, BotWorker } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const BotkitUtils = {
    on(
        controller: Botkit,
        events: string | string[],
        handler: SlackBotkitHandler
    ) {
        return controller.on(
            events,
            async (bot: BotWorker, message: BotkitMessage) => {
                await handler(bot as SlackBotWorker, message);
            }
        );
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { BotkitUtils };

// #endregion Exports

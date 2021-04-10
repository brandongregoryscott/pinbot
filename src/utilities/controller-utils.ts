import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitHandler, BotkitMessage, BotWorker } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const ControllerUtils = {
    on(
        controller: Botkit,
        events: string | string[],
        handler: SlackBotkitHandler
    ) {
        return controller.on(
            events,
            async (bot: BotWorker, message: BotkitMessage) => {
                const debug = process.env.DEBUG === "true";

                if (debug) {
                    log(message);
                }

                handler(bot as SlackBotWorker, message);
            }
        );
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const header = () => console.log("-".repeat(80));

const log = (message: BotkitMessage) => {
    const { type, user, channel_id, item } = message;
    header();
    console.log(`Type: ${type}\tUser: ${user}\tchannel_id: ${channel_id}`);
    console.log(JSON.stringify(item, undefined, 4));
    header();
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { ControllerUtils };

// #endregion Exports

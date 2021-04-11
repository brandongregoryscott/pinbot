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

                await handler(bot as SlackBotWorker, message);
            }
        );
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const divider = () => console.log("-".repeat(80));

const log = (message: BotkitMessage) => {
    const { type, user, channel_id, item } = message;

    divider();
    console.log(`Type: ${type}`);
    console.log(`User: ${user}`);
    console.log(`channel_id: ${channel_id}`);
    console.log(JSON.stringify(item, undefined, 4));
    divider();
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { ControllerUtils as BotkitUtils };

// #endregion Exports

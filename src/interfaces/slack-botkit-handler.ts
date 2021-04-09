import { SlackBotWorker } from "botbuilder-adapter-slack";
import { BotkitHandler, BotkitMessage } from "botkit";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface SlackBotkitHandler {
    (bot: SlackBotWorker, message: BotkitMessage): Promise<any>;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { SlackBotkitHandler };

// #endregion Exports

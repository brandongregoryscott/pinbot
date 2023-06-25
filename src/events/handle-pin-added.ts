import type { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import type { Pin } from "../interfaces/slack/pin";
import { on } from "../utilities/botkit-utils";
import { buildPinMessage } from "../utilities/message-utils";

const _handlePinAdded: SlackBotkitHandler = async (bot, message) => {
    const pin = message.item as Pin;
    await bot.reply(message, buildPinMessage(pin.message?.permalink));
};

const handlePinAdded = on("pin_added", _handlePinAdded);

export default handlePinAdded;

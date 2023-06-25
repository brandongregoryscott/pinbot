import type { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { hears } from "../utilities/botkit-utils";
import { buildPinMessage } from "../utilities/message-utils";
import { getRandomPin } from "../utilities/slack-utils";

const _handleRandom: SlackBotkitHandler = async (bot, message) => {
    const pin = await getRandomPin(bot.api);

    await bot.reply(message, buildPinMessage(pin.message?.permalink));
};

const handleRandom = hears(/r|random/gi, "direct_mention", _handleRandom);

export default handleRandom;

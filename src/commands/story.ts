import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { hears } from "../utilities/botkit-utils";
import { randomItem } from "../utilities/core-utils";
import { buildPinMessage } from "../utilities/message-utils";
import { getRandomPins } from "../utilities/slack-utils";

const _handleStory: SlackBotkitHandler = async (bot, message) => {
    const count = randomItem([3, 4]);
    const pins = await getRandomPins(bot.api, count);

    await bot.reply(
        message,
        buildPinMessage(pins.map((pin) => pin.message?.permalink).join("\n"))
    );
};

const handleStory = hears(/s|story/gi, "direct_mention", _handleStory);

export default handleStory;

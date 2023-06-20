import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { Channel } from "../interfaces/slack/channel";
import { Message } from "../interfaces/slack/message";
import { Pin } from "../interfaces/slack/pin";
import { Profile } from "../interfaces/slack/profile";
import { BotkitUtils } from "../utilities/botkit-utils";
import { Message as BuildMessage } from "slack-block-builder";

const _handlePinAdded: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    const pin = message.item as Pin;
    const response = BuildMessage({
        text: pin.message?.permalink,
    }).buildToObject();

    await bot.reply(message, response);
};

const handlePinAdded = (controller: Botkit) =>
    BotkitUtils.on(controller, "pin_added", _handlePinAdded);

export default handlePinAdded;

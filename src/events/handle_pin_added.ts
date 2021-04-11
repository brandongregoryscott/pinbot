import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { Channel } from "../interfaces/slack/channel";
import { File } from "../interfaces/slack/file";
import { Message } from "../interfaces/slack/message";
import { Pin } from "../interfaces/slack/pin";
import { Profile } from "../interfaces/slack/profile";
import { BotkitUtils } from "../utilities/botkit-utils";
import { CoreUtils } from "../utilities/core-utils";
import { PinUtils } from "../utilities/pin-utils";

const handlePinAdded: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    const item = message.item as Pin;
    const pin: Message = item.message!;
    const userResponse = (await bot.api.users.info({ user: pin.user })) as any;
    const profile: Profile = userResponse.user.profile;
    const conversationResponse = await bot.api.conversations.info({
        channel: item.channel!,
    });
    const channel = conversationResponse.channel as Channel;

    const response = PinUtils.toMessage(pin, channel, profile);
    console.log("response:", JSON.stringify(response, undefined, 4));
    await bot.reply(message, response);
};

export default (controller: Botkit) =>
    BotkitUtils.on(controller, "pin_added", handlePinAdded);

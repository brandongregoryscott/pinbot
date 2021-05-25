import { SlackBotWorker } from "botbuilder-adapter-slack";
import { PinsListResponse } from "../interfaces/slack/pins-list-response";
import { Botkit, BotkitHandler, BotkitMessage } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { CoreUtils } from "../utilities/core-utils";
import { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { MessageUtils } from "../utilities/message-utils";
import { Profile } from "../interfaces/slack/profile";
import { ChannelType } from "../enums/channel-type";
import { ChannelUtils } from "../utilities/channel-utils";
import { BotkitUtils } from "../utilities/botkit-utils";
import { Pin } from "../interfaces/slack/pin";
import { PinType } from "../enums/pin-type";

const handleRandomPin: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    let { channels } = (await bot.api.conversations.list({
        exclude_archived: true,
        types: ChannelType.Public,
    })) as ChannelsListResponse;

    // Safeguard incase we are not a member of the channel
    channels = ChannelUtils.filterByIsMember(channels);

    const randomChannel = CoreUtils.randomItem(channels);

    const { items: pins } = (await bot.api.pins.list({
        channel: randomChannel.id,
    })) as PinsListResponse;

    const randomPin = CoreUtils.randomItem(
        pins,
        (pin: Pin) => pin.type === PinType.Message
    );

    const { user } = (await bot.api.users.info({
        user: message.user,
    })) as any;
    const profile: Profile = user.profile;

    const response = MessageUtils.toPinReply(
        randomPin.message!,
        randomChannel,
        profile
    );

    await bot.reply(message, response);
};

module.exports = function (controller: Botkit) {
    BotkitUtils.hears(
        controller,
        /r|random/gi,
        "direct_mention",
        handleRandomPin as BotkitHandler
    );
};

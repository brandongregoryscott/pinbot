import { SlackBotWorker } from "botbuilder-adapter-slack";
import { PinsListResponse } from "../interfaces/slack/pins-list-response";
import { Botkit, BotkitHandler, BotkitMessage } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { flattenImageFiles, toPinReply } from "../utilities/message-utils";
import { ChannelType } from "../enums/channel-type";
import { BotkitUtils } from "../utilities/botkit-utils";
import { Pin } from "../interfaces/slack/pin";
import { PinType } from "../enums/pin-type";
import { UserInfoResponse } from "../interfaces/slack/user-info-response";
import { filterByIsMember } from "../utilities/channel-utils";
import { randomItem } from "../utilities/core-utils";

const _handleRandomPin: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    let { channels } = (await bot.api.conversations.list({
        exclude_archived: true,
        types: ChannelType.Public,
    })) as ChannelsListResponse;

    // Safeguard incase we are not a member of the channel
    channels = filterByIsMember(channels);

    const randomChannel = randomItem(channels);

    const { items: pins } = (await bot.api.pins.list({
        channel: randomChannel.id,
    })) as PinsListResponse;

    const randomPin = randomItem(
        pins,
        (pin: Pin) =>
            pin.type === PinType.Message &&
            pin.message != null &&
            flattenImageFiles(pin.message).length < 1
    );

    const { user } = (await bot.api.users.info({
        user: randomPin?.message?.user ?? "",
    })) as UserInfoResponse;

    const { profile } = user;

    const response = toPinReply(randomPin.message!, randomChannel, profile);

    await bot.reply(message, response);
};

const handleRandomPin = (controller: Botkit) =>
    BotkitUtils.hears(
        controller,
        /r|random/gi,
        "direct_mention",
        _handleRandomPin as BotkitHandler
    );

export default handleRandomPin;

import { PinsListResponse } from "../interfaces/slack/pins-list-response";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { ChannelType } from "../enums/channel-type";
import { hears } from "../utilities/botkit-utils";
import { Pin } from "../interfaces/slack/pin";
import { PinType } from "../enums/pin-type";
import { filterByIsMember } from "../utilities/channel-utils";
import { randomItem } from "../utilities/core-utils";
import isEmpty from "lodash/isEmpty";
import { CHANNEL } from "../utilities/config";
import { buildPinMessage } from "../utilities/message-utils";

const _handleRandomPin: SlackBotkitHandler = async (bot, message) => {
    let { channels } = (await bot.api.conversations.list({
        exclude_archived: true,
        types: ChannelType.Public,
    })) as ChannelsListResponse;

    // Safeguard incase we are not a member of the channel
    channels = filterByIsMember(channels);

    const randomChannel = !isEmpty(CHANNEL)
        ? channels.find((channel) => channel.name === CHANNEL)!
        : randomItem(channels);

    const { items: pins } = (await bot.api.pins.list({
        channel: randomChannel.id,
    })) as PinsListResponse;

    const randomPin = randomItem(
        pins,
        (pin: Pin) => pin.type === PinType.Message && pin.message != null
    );

    await bot.reply(message, buildPinMessage(randomPin.message?.permalink));
};

const handleRandomPin = hears(/r|random/gi, "direct_mention", _handleRandomPin);

export default handleRandomPin;

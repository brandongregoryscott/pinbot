import range from "lodash/range";
import type { Pin } from "../interfaces/slack/pin";
import { CHANNEL } from "./config";
import isEmpty from "lodash/isEmpty";
import { randomItem } from "./core-utils";
import type { PinsListResponse } from "../interfaces/slack/pins-list-response";
import { PinType } from "../enums/pin-type";
import { filterByIsMember } from "./channel-utils";
import type { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { ChannelType } from "../enums/channel-type";
import type { SlackBotWorker } from "botbuilder-adapter-slack";

type WebClient = SlackBotWorker["api"];

const getRandomPin = async (api: WebClient): Promise<Pin> => {
    let { channels } = (await api.conversations.list({
        exclude_archived: true,
        types: ChannelType.Public,
    })) as ChannelsListResponse;

    // Safeguard incase we are not a member of the channel
    channels = filterByIsMember(channels);

    const randomChannel = !isEmpty(CHANNEL)
        ? channels.find((channel) => channel.name === CHANNEL)
        : randomItem(channels);

    const { items: pins } = (await api.pins.list({
        channel: randomChannel?.id ?? "",
    })) as PinsListResponse;

    return randomItem(
        pins,
        (pin) =>
            pin != null && pin.type === PinType.Message && pin.message != null
    );
};

const getRandomPins = async (api: WebClient, count = 1): Promise<Pin[]> => {
    const pins = await Promise.all(
        range(0, count).map(() => getRandomPin(api))
    );

    return pins;
};

export { getRandomPin, getRandomPins };

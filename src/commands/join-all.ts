import { ChannelType } from "../enums/channel-type";
import type { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import type { Channel } from "../interfaces/slack/channel";
import type { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { hears } from "../utilities/botkit-utils";
import { filterByNonMember } from "../utilities/channel-utils";
import { throttle } from "../utilities/core-utils";
import { Md } from "slack-block-builder";

const _handleJoinAll: SlackBotkitHandler = async (bot) => {
    const { channels: publicChannels } = (await bot.api.conversations.list({
        exclude_archived: true,
        types: ChannelType.Public,
    })) as ChannelsListResponse;

    const publicChannelsToJoin = filterByNonMember(publicChannels);
    if (publicChannelsToJoin.length < 1) {
        return await bot.say("No public channels to join.");
    }

    await bot.say(
        `Attempting to join ${publicChannelsToJoin.length} channels...`
    );

    const joinChannel = throttle(async (channel: Channel) => {
        console.log(`Attempting to join ${channel.name}`);
        await bot.api.conversations.join({
            channel: channel.id,
        });
    });

    const joinChannelPromises = publicChannelsToJoin.map(joinChannel);
    await Promise.all(joinChannelPromises);

    await bot.say(
        `Finished joining ${
            publicChannelsToJoin.length
        } channels: ${joinChannelNames(publicChannelsToJoin)}`
    );
};

const joinChannelNames = (channels: Channel[]): string =>
    Md.codeBlock(channels.map((e) => e.name).join(", "));

const handleJoinAll = hears("join all", "direct_mention", _handleJoinAll);

export { handleJoinAll };

import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage } from "botkit";
import { ChannelType } from "../enums/channel-type";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { Channel } from "../interfaces/slack/channel";
import { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { BotkitUtils } from "../utilities/botkit-utils";
import { CoreUtils } from "../utilities/core-utils";
import { StringUtils } from "../utilities/string-utils";

const handleJoinAll: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    const { channels: publicChannels } = (await bot.api.conversations.list({
        exclude_archived: true,
        types: ChannelType.Public,
    })) as ChannelsListResponse;

    const publicChannelsToJoin = publicChannels.filter(filterByNonMember);
    if (publicChannelsToJoin.length < 1) {
        return await bot.say("No public channels to join.");
    }

    await bot.say(
        `Attempting to join ${publicChannelsToJoin.length} channels...`
    );

    const joinChannel = CoreUtils.throttle(async (channel: Channel) => {
        console.log(`Attempting to join ${channel.name}`);
        await bot.api.conversations.join({
            channel: channel.id,
        });
    });

    const joinChannelPromises = publicChannelsToJoin.map(joinChannel);
    await Promise.all(joinChannelPromises);

    await bot.say(
        `Finished joining ${publicChannelsToJoin.length} channels: ${joinChannelNames}`
    );
};

const filterByNonMember = (channel: Channel) => !channel.is_member;

const joinChannelNames = (channels: Channel[]): string =>
    StringUtils.formatCodeBlock(channels.map((e) => e.name).join(", "));

export default (controller: Botkit) =>
    BotkitUtils.hears(controller, "join all", "direct_mention", handleJoinAll);

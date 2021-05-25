import { SlackBotWorker } from "botbuilder-adapter-slack";
import { Botkit, BotkitMessage } from "botkit";
import { SlackBotkitHandler } from "../interfaces/slack-botkit-handler";
import { Channel } from "../interfaces/slack/channel";
import { ChannelsListResponse } from "../interfaces/slack/channels-list-response";
import { BotkitUtils } from "../utilities/botkit-utils";
import { CoreUtils } from "../utilities/core-utils";

const handleJoinAll: SlackBotkitHandler = async (
    bot: SlackBotWorker,
    message: BotkitMessage
) => {
    const channelsResponse = (await bot.api.conversations.list({
        exclude_archived: true,
    })) as ChannelsListResponse;
    const { channels } = channelsResponse;

    const channelsToJoin = channels.filter(
        (channel) => !channel.is_private && !channel.is_member
    );

    if (channelsToJoin.length < 1) {
        return await bot.say("No public channels to join.");
    }

    await bot.say(`Attempting to join ${channelsToJoin.length} channels...`);

    const joinChannel = CoreUtils.throttle(async (channel: Channel) => {
        console.log(`Attempting to join ${channel.name}`);
        await bot.api.conversations.join({
            channel: channel.id,
        });
    });

    const joinChannelPromises = channelsToJoin.map(joinChannel);
    await Promise.all(joinChannelPromises);

    await bot.say(
        `Finished joining ${
            channelsToJoin.length
        } channels: \`\`\`${channelsToJoin.map((e) => e.name).join(", ")}\`\`\``
    );
};

export default (controller: Botkit) =>
    BotkitUtils.hears(controller, "join all", "direct_mention", handleJoinAll);

import { Channel } from "../interfaces/slack/channel";

const ChannelUtils = {
    filterByIsMember(channels: Channel[]): Channel[] {
        return channels.filter((channel) => channel.is_member);
    },
    filterByNonMember(channels: Channel[]): Channel[] {
        return channels.filter((channel) => !channel.is_member);
    },
};

export { ChannelUtils };

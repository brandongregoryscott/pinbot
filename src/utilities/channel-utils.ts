import { Channel } from "../interfaces/slack/channel";

const filterByIsMember = (channels: Channel[]): Channel[] =>
    channels.filter((channel) => channel.is_member);

const filterByNonMember = (channels: Channel[]): Channel[] =>
    channels.filter((channel) => !channel.is_member);

export { filterByIsMember, filterByNonMember };

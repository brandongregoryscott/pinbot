import { Channel } from "../interfaces/slack/channel";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const ChannelUtils = {
    filterByIsMember(channels: Channel[]): Channel[] {
        return channels.filter((channel) => channel.is_member);
    },
    filterByNonMember(channels: Channel[]): Channel[] {
        return channels.filter((channel) => !channel.is_member);
    },
};
// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { ChannelUtils };

// #endregion Exports

import { WebAPICallResult } from "@slack/web-api";
import { Channel } from "./channel";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface ChannelsListResponse extends WebAPICallResult {
    channels: Channel[];
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { ChannelsListResponse };

// #endregion Exports

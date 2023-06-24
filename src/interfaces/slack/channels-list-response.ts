import type { WebAPICallResult } from "@slack/web-api";
import type { Channel } from "./channel";

interface ChannelsListResponse extends WebAPICallResult {
    channels: Channel[];
}

export type { ChannelsListResponse };

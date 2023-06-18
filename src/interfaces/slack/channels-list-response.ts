import { WebAPICallResult } from "@slack/web-api";
import { Channel } from "./channel";

interface ChannelsListResponse extends WebAPICallResult {
    channels: Channel[];
}

export { ChannelsListResponse };

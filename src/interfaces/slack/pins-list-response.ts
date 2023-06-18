import { WebAPICallResult } from "@slack/web-api";
import { Pin } from "./pin";

interface PinsListResponse extends WebAPICallResult {
    items: Pin[];
}

export { PinsListResponse };

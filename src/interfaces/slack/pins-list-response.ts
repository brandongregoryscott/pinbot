import type { WebAPICallResult } from "@slack/web-api";
import type { Pin } from "./pin";

interface PinsListResponse extends WebAPICallResult {
    items: Pin[];
}

export type { PinsListResponse };

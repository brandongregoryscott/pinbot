import type { WebAPICallResult } from "@slack/web-api";
import type { User } from "./user";

interface UserInfoResponse extends WebAPICallResult {
    user: User;
}

export type { UserInfoResponse };

import { WebAPICallResult } from "@slack/web-api";
import { User } from "./user";

interface UserInfoResponse extends WebAPICallResult {
    user: User;
}

export { UserInfoResponse };

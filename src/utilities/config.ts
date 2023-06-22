import isEmpty from "lodash/isEmpty";
import dotenv from "dotenv";

if (process.env.ENV !== "production") {
    // Load process.env values from .env file
    dotenv.config();
}

const USERS: Record<string, string> = isEmpty(process.env.USERS)
    ? {}
    : JSON.parse(process.env.USERS!);

const TOKENS: Record<string, string> = isEmpty(process.env.TOKENS)
    ? {}
    : JSON.parse(process.env.TOKENS!);

const DEBUG = process.env.DEBUG === "true";

const {
    CHANNEL,
    CLIENT_ID,
    CLIENT_SECRET,
    CLIENT_SIGNING_SECRET,
    REDIRECT_URI,
} = process.env;

export {
    CHANNEL,
    DEBUG,
    USERS,
    TOKENS,
    CLIENT_ID,
    CLIENT_SECRET,
    CLIENT_SIGNING_SECRET,
    REDIRECT_URI,
};

import isEmpty from "lodash/isEmpty";

const USERS: Record<string, string> = isEmpty(process.env.USERS)
    ? {}
    : JSON.parse(process.env.USERS!);

const TOKENS: Record<string, string> = isEmpty(process.env.TOKENS)
    ? {}
    : JSON.parse(process.env.TOKENS!);

const {
    CLIENT_ID,
    CLIENT_SECRET,
    CLIENT_SIGNING_SECRET,
    REDIRECT_URI,
} = process.env;

export {
    USERS,
    TOKENS,
    CLIENT_ID,
    CLIENT_SECRET,
    CLIENT_SIGNING_SECRET,
    REDIRECT_URI,
};

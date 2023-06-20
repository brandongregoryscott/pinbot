import { Botkit } from "botkit";
import {
    SlackAdapter,
    SlackMessageTypeMiddleware,
    SlackEventMiddleware,
} from "botbuilder-adapter-slack";
import { LoggerMiddleware } from "./middlewares/logger-middleware";
import {
    CLIENT_ID,
    CLIENT_SECRET,
    CLIENT_SIGNING_SECRET,
    REDIRECT_URI,
    TOKENS,
    USERS,
} from "./utilities/config";
import isEmpty from "lodash/isEmpty";

const adapter = new SlackAdapter({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    clientSigningSecret: CLIENT_SIGNING_SECRET,
    getBotUserByTeam: getBotUserByTeam,
    getTokenForTeam: getTokenForTeam,
    oauthVersion: "v2",
    redirectUri: REDIRECT_URI,
    scopes: [
        "app_mentions:read",
        "channels:history",
        "channels:join",
        "channels:read",
        "chat:write",
        "chat:write.public",
        "chat:write.customize",
        "commands",
        "groups:read",
        "groups:history",
        "incoming-webhook",
        "pins:read",
        "pins:write",
        "users:read",
    ],
});

adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());
adapter.use(new LoggerMiddleware());

const controller = new Botkit({
    webhook_uri: "/api/messages",
    adapter,
});

controller.ready(() => {
    // load traditional developer-created local custom feature modules
    controller.loadModules(`${__dirname}/events`);
    controller.loadModules(`${__dirname}/commands`);
});

controller.webserver.get("/", (_req, res) => {
    res.send(`This app is running Botkit ${controller.version}.`);
});

controller.webserver.get("/install", (_req, res) => {
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get("/install/auth", async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(
            req.query.code
        );

        const { team_id, access_token, bot_user_id } = results;
        console.log({ team_id, access_token, bot_user_id });

        // Store token by team in bot state.
        TOKENS[team_id] = access_token;

        // Capture team to bot id
        USERS[team_id] = bot_user_id;

        res.json("Success! Bot installed.");
    } catch (error) {
        console.error("OAUTH ERROR:", error);
        res.status(401);

        if (error instanceof Error) {
            res.send(error.message);
        }
    }
});

/**
 * A method that receives a Slack team id and returns the bot user id associated with that team. Required for multi-team apps.
 */
async function getTokenForTeam(teamId: string): Promise<string> {
    if (!isEmpty(TOKENS[teamId])) {
        return TOKENS[teamId];
    }

    throw new Error(`Token not found in cache for teamId ${teamId}`);
}

/**
 * A method that receives a Slack team id and returns the bot token associated with that team. Required for multi-team apps.
 */
async function getBotUserByTeam(teamId: string): Promise<string> {
    if (!isEmpty(USERS[teamId])) {
        return USERS[teamId];
    }

    throw new Error(`UserId not found in cache for teamId ${teamId}`);
}

import { Botkit } from "botkit";
import {
    SlackAdapter,
    SlackMessageTypeMiddleware,
    SlackEventMiddleware,
} from "botbuilder-adapter-slack";
import dotenv from "dotenv";
import { LoggerMiddleware } from "./middlewares/logger-middleware";

console.log("process.env", process.env);

if (process.env.NODE_ENV !== "production") {
    // Load process.env values from .env file
    dotenv.config();
}

const adapter = new SlackAdapter({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    getBotUserByTeam: getBotUserByTeam,
    getTokenForTeam: getTokenForTeam,
    oauthVersion: "v2",
    redirectUri: process.env.REDIRECT_URI,
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

        console.log("FULL OAUTH DETAILS", results);

        // Store token by team in bot state.
        tokenCache[results.team_id] = results.access_token;

        // Capture team to bot id
        userCache[results.team_id] = results.bot_user_id;

        res.json("Success! Bot installed.");
    } catch (error) {
        console.error("OAUTH ERROR:", error);
        res.status(401);

        if (error instanceof Error) {
            res.send(error.message);
        }
    }
});

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
    tokenCache = JSON.parse(process.env.TOKENS);
    console.log("tokenCache", tokenCache);
}

if (process.env.USERS) {
    userCache = JSON.parse(process.env.USERS);
    console.log("userCache", userCache);
}

/**
 * A method that receives a Slack team id and returns the bot user id associated with that team. Required for multi-team apps.
 */
async function getTokenForTeam(teamId: string): Promise<string> {
    if (tokenCache[teamId]) {
        return tokenCache[teamId];
    }

    throw new Error(`Token not found in cache for teamId ${teamId}`);
}

/**
 * A method that receives a Slack team id and returns the bot token associated with that team. Required for multi-team apps.
 */
async function getBotUserByTeam(teamId: string): Promise<string> {
    if (userCache[teamId]) {
        return userCache[teamId];
    }

    throw new Error(`UserId not found in cache for teamId ${teamId}`);
}

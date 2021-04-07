import { Botkit } from "botkit";
import {
    SlackAdapter,
    SlackMessageTypeMiddleware,
    SlackEventMiddleware,
} from "botbuilder-adapter-slack";
import dotenv from "dotenv";

// Load process.env values from .env file
dotenv.config();

const adapter = new SlackAdapter({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    getBotUserByTeam: getBotUserByTeam,
    getTokenForTeam: getTokenForTeam,
    oauthVersion: "v2",
    redirectUri: process.env.REDIRECT_URI,
    scopes: [
        "commands",
        "pins:read",
        "pins:write",
        "channels:history",
        "users:read",
        "channels:join",
        "channels:read",
        "chat:write",
        "incoming-webhook",
        "app_mentions:read",
        "chat:write.public",
        "chat:write.customize",
        "groups:read",
    ],
    verificationToken: process.env.VERIFICATION_TOKEN,
});

adapter.use(new SlackEventMiddleware());
adapter.use(new SlackMessageTypeMiddleware());

const controller = new Botkit({
    webhook_uri: "/api/messages",
    adapter: adapter,
});

controller.ready(() => {
    // load traditional developer-created local custom feature modules
    controller.loadModules(`${__dirname}/events`);
    controller.loadModules(`${__dirname}/commands`);
});

controller.webserver.get("/", (req, res) => {
    res.send(`This app is running Botkit ${controller.version}.`);
});

controller.webserver.get("/install", (req, res) => {
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
    } catch (err) {
        console.error("OAUTH ERROR:", err);
        res.status(401);
        res.send(err.message);
    }
});

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
    tokenCache = JSON.parse(process.env.TOKENS);
    console.log("tokenCache:", tokenCache);
}

if (process.env.USERS) {
    userCache = JSON.parse(process.env.USERS);
    console.log("userCache:", userCache);
}

async function getTokenForTeam(teamId): Promise<string> {
    if (tokenCache[teamId]) {
        return new Promise((resolve) => {
            setTimeout(function () {
                resolve(tokenCache[teamId]);
            }, 150);
        });
    } else {
        console.error("Team not found in tokenCache: ", teamId);
    }

    return "";
}

async function getBotUserByTeam(teamId): Promise<string> {
    if (userCache[teamId]) {
        return new Promise((resolve) => {
            setTimeout(function () {
                resolve(userCache[teamId]);
            }, 150);
        });
    } else {
        console.error("Team not found in userCache: ", teamId);
    }

    return "";
}

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

controller.webserver.get("/install", (req, res) => {
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get("/install/auth", async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(
            req.query.code
        );

        console.log("FULL OAUTH DETAILS", results);

        res.json("Success! Bot installed.");
    } catch (error) {
        console.error("OAUTH ERROR:", error);
        res.status(401);

        if (error instanceof Error) {
            res.send(error.message);
        }
    }
});

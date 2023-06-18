# Pinbot

<a href="https://github.com/brandongregoryscott/pinbot/actions/workflows/build.yaml">
    <img alt="build status" src="https://github.com/brandongregoryscott/pinbot/actions/workflows/build.yaml/badge.svg"/>
</a>

This is a Slack bot that re-shares messages when they are pinned, which was a feature that was removed in November 2016. It also provides some additional commands around pins, such as the _random_ pin.

## Tech

-   [Botkit](https://github.com/howdyai/botkit)

# Running Locally

To run `pinbot` locally, you'll need to make sure you have Ngrok installed (`brew install ngrok`), and you'll likely want to set up a "Development" app so the production app can continue running with separate credentials.

First, set up your `.env` file:

```sh
cp .env.sample .env
```

Visit the App Credentials page https://api.slack.com/apps/{appId}/general and fill in the required values:

![App Credentials](./AppCredentials.png)

```sh
# Terminal #1
npm run watch

# Terminal #2
npm run dev

# Terminal #3
ngrok http 3000
```

Once you have an Ngrok tunnel set up, you'll need to edit the webhook URL that Slack posts messages to.

Visit the Event Subscriptions page https://api.slack.com/apps/{appId}/event-subscriptions and edit the Request URL.

![Event Subscriptions page](./EventSubscriptions.png)

It should look something like this: https://6edf-98-49-236-176.ngrok-free.app/api/messages, and Slack will send a request to verify the URL is listening.

# Deployment

Pinbot is currently deployed on [Render](https://render.com/).

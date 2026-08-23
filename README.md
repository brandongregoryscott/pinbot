# Pinbot

Pinbot is a Discord bot that re-shares messages when they are pinned, which was a Slack feature that was removed in November 2016. It also provides some additional commands around pins, such as the _random_ pin.

## Commands

Mention the bot followed by one of the following commands:

- `r`, `random` — sends a random pin
- `ri`, `randomimage` — sends a random image pin
- `pc`, `pincount`, `count` — replies with the pin count for the current channel
- `help` — lists all commands and aliases

## Development

### Requirements

- [Ruby](https://www.ruby-lang.org/) installed
- [Discord application](https://discord.com/developers/applications) with [Privileged Gateway Intents]() enabled
    - These can be enabled on the Bot page, i.e. https://discord.com/developers/applications/:applicationId/bot. This is the same page that the Bot token can be generated or reset.

```sh
bundle install
BOT_TOKEN=FOO.123_bar ruby src/pinbot.rb
```
# Pinbot

Pinbot is a Discord bot that re-shares messages when they are pinned, which was a Slack feature that was removed in November 2016. It also provides some additional commands around pins, such as the _random_ pin.

## Commands

Mention the bot followed by one of the following commands:

- `r`, `random` — sends a random pin
- `ri`, `randomimage` — sends a random image pin
- `pc`, `pincount`, `count` — replies with the pin count for the current channel
- `t`, `today` — sends a pin from this date in history
- `b`, `battle` — puts two random pins head to head
- `battle finish` — immediately resolves the current battle using its current votes
- `battle cancel` — closes the current battle without changing wins or losses
- `help` — lists all commands and aliases

## Pin Battles

Start a battle with `@Pinbot battle`. Pinbot presents two distinct random pins and adds 🅰️ and 🅱️ reactions. Each human participant has one vote and can change it by reacting to the other option. A battle ends as soon as three unique people have voted, or after one hour. The result showcases the winning pin. Timed-out ties are recorded as draws; Pinbot's joke tiebreak choice does not change either pin's totals.

Pin wins, losses, battle history, and votes are stored in SQLite. Docker Compose mounts the named `pinbot_data` volume at `/app/data`, where the bot stores `pinbot.sqlite3`, so results survive container recreation. Set `PINBOT_DATABASE_PATH` to use a different path outside Docker.

## Development

### Requirements

- [Ruby](https://www.ruby-lang.org/) installed
- [Discord application](https://discord.com/developers/applications) with [Privileged Gateway Intents]() enabled
    - These can be enabled on the Bot page, i.e. https://discord.com/developers/applications/:applicationId/bot. This is the same page that the Bot token can be generated or reset.

```sh
bundle install
BOT_TOKEN=FOO.123_bar ruby src/pinbot.rb
```

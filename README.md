# Homebridge Telegram

A Homebridge platform plugin that exposes Telegram notifications as HomeKit switches.

## Highlights

- Works with Homebridge 1 and Homebridge 2
- Supports Node.js 20, 22, and 24
- Exposes standard HomeKit switches that can be triggered directly from the Apple Home app
- Includes a dedicated `Quiet` switch to mute outgoing messages temporarily

## Why this plugin?

This plugin lets you trigger Telegram messages from HomeKit automations, scenes, and switch taps. Each notification group in your config becomes its own HomeKit switch and sends one of the configured Telegram messages when toggled on.

That makes it useful for things like:

- sending a reminder when a window stays open
- triggering a predefined alert from a scene or automation
- keeping a small set of friendly or randomized status messages available in HomeKit

The bot is send-only. It does not react to incoming Telegram messages or commands.

## Requirements

- Homebridge `^1.8.0` or `^2.0.0-beta.0`
- Node.js `20`, `22`, or `24`

## Installation

```bash
sudo npm install -g homebridge-telegram
```

## Configuration

Example `config.json`:

```json
{
  "platforms": [
    {
      "platform": "Telegram",
      "bots": [
        {
          "name": "MyTelegramBot",
          "token": "TELEGRAM BOT TOKEN",
          "chat": "TELEGRAM CHAT ID",
          "error": "Something broken. I'm shutting down.",
          "notifications": {
            "Hello": {
              "mode": "Markdown",
              "randomize": true,
              "messages": [
                "*Hi!*",
                "_Hello!_",
                "Hey mate!"
              ]
            },
            "Bye": {
              "mode": "HTML",
              "randomize": false,
              "messages": [
                "<b>Good bye!</b>",
                "<i>I'm sad to see you leave.</i>"
              ]
            }
          }
        }
      ]
    }
  ]
}
```

Simple style configuration still works and can be mixed with the advanced format:

```json
"Hello": [
  "Hi!",
  "Hello!",
  "Hey mate!"
]
```

### Bot options

| Attribute | Usage |
|-----------|-------|
| `name` | Unique bot name used as the accessory name |
| `token` | Telegram bot token |
| `chat` | Telegram chat ID that receives the message |
| `error` | Optional error message sent when Telegram communication fails |
| `notifications` | Named notification groups exposed as switches |

### Notification group options

| Attribute | Usage |
|-----------|-------|
| `mode` | Optional Telegram parse mode: `Markdown` or `HTML` |
| `randomize` | Optional boolean, defaults to `true` |
| `messages` | Array of messages used by the switch |

## HomeKit behavior

Each configured bot exposes:

- one `Quiet` switch
- one switch per notification group

Behavior:

- Turning a notification switch on sends one Telegram message and resets the switch back to off
- Turning `Quiet` on suppresses outgoing Telegram messages
- The visible switch name matches the notification group name from `notifications`

## Creating a bot

Telegram's own [BotFather documentation](https://core.telegram.org/bots#6-botfather) is the best starting point for creating a bot.

After creating the bot, send it a message once and inspect the Homebridge log output if you still need to determine the correct chat ID.

## Formatting

Telegram formatting rules are documented here:

- [Telegram Bot API formatting options](https://core.telegram.org/bots/api#formatting-options)

## Troubleshooting

- If messages are not sent, verify `token` and `chat` first
- If a formatted message fails, check whether the configured Telegram `Markdown` or `HTML` is valid
- If the accessory appears unavailable, inspect the Homebridge log for Telegram API errors

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT

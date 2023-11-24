# Beabee Telegram Bot

This repository contains the source code for the Beabee Telegram Bot prototype.

## Development

### Setup Instructions

To get started, install Deno. We recommend using a [Deno Version Manager (DVM)](https://github.com/justjavac/dvm) for easier migration between different versions of Deno.

### Configuring Your Environment

Begin by duplicating the `.env.example` file and renaming it to `.env`. Then, fill in the necessary values as per your setup requirements.

#### Generating a Telegram Bot Token

To use the Telegram API, you need to create a bot and obtain a token. Follow these simple steps:

1. Start with BotFather:
  * In Telegram, search and start a chat with `BotFather`.
  * Send `/newbot` and follow the prompts to create a new bot.
  * After creation, BotFather will provide a token, looking like `123456789:ABCDEFabcdef123456123456`.

2. Store the Token:
  * In your project's root directory, find or create a `.env` file.
  * Add the token in this format:

    ```makefile
    TELEGRAM_TOKEN="your_token_here"
    ```

  * Replace `your_token_here` with the token from BotFather.

Ensure the `.env` file is saved and your bot is ready to connect with the Telegram API.

## Running the Bot

To view the list of available commands, refer to the `deno.json` file. For running the bot in development mode, execute the following command:

```bash
deno task dev
```

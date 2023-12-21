# Beabee Telegram Bot

This repository contains the source code for the Beabee Telegram Bot prototype.

## Development

### Setup Instructions

To get started, install Deno. We recommend using a
[Deno Version Manager (DVM)](https://github.com/justjavac/dvm) for easier
migration between different versions of Deno.

### Configuring Your Environment

Begin by duplicating the `.env.example` file and renaming it to `.env`. Then,
fill in the necessary values as per your setup requirements.

#### Generating a Telegram Bot Token

To use the Telegram API, you need to create a bot and obtain a token. Follow
these simple steps:

1. Start with BotFather:
   - In Telegram, search and start a chat with `BotFather`.
   - Send `/newbot` and follow the prompts to create a new bot.
   - After creation, BotFather will provide a token, looking like
     `123456789:ABCDEFabcdef123456123456`.

2. Store the Token:
   - In your project's root directory, find or create a `.env` file.
   - Add the token in this format:

     ```makefile
     TELEGRAM_TOKEN="your_token_here"
     ```

   - Replace `your_token_here` with the token from BotFather.

Ensure the `.env` file is saved and your bot is ready to connect with the
Telegram API.

### Testing

Just run `deno test` in the project root directory.

### Linting

To lint the project, run `deno lint` in the project root directory.

### Formatting

To format the project, run `deno fmt` in the project root directory.

## Running the Bot

To view the list of available commands, refer to the `deno.json` file. For
running the bot in development mode, execute the following command:

```bash
deno task dev
```

## Project Structure

The project is organized into several main folders, each containing specific
parts of the application:

- `commands`: Contains classes representing each Telegram command.
- `renderer`: Includes classes for rendering Markdown texts, including
  `CalloutRenderer`, `MessageRenderer`, and `CalloutResponseRenderer`.
- `services`: Contains classes for various services such as retrieving callout
  data, creating Telegram keyboards, and firing various events.
- `areas`: Contains areas from the Alosaur Framework, currently only `CoreArea`.
- `scripts`: Contains scripts for automation and building project components.
- `types`: Houses all types and interfaces.
- `utils`: Contains helper functions, such as `escapeMd` to escape Telegram
  Markdown V2 characters, and more.
- `event-managers`: This folder is dedicated to handling event-related logic. It
  contains the event handlers which are responsible for responding to various
  events triggered throughout the application. The organization of this folder
  allows for a clear and efficient handling of the event-driven aspects of the
  application.

## Docker

To build the Docker image, you can use the following command:

```bash
deno task docker:build
```

And to run the Docker container, you can use the following command:

```bash
deno task docker:start
```

This assumes that your application is listening on port 8080. If it's listening on a different port, replace `8080:8080` with `<your port>:<your port>`.

### Contributing

We welcome contributions from the community! If you want to fix a bug, add a
feature, or improve documentation, feel free to create a pull request.

### FAQ

Frequently Asked Questions and answers about this project will be listed here.
For further questions, do not hesitate to create an issue.

## License

This project is licensed under the GNU Affero General Public License (AGPL). For
more details, see the [LICENSE](LICENSE) file in the repository. The AGPL is a
free, copyleft license particularly suitable for software that runs over a
network, ensuring that the source code is available to users who interact with
it remotely. By using this license, you ensure that all modifications and
derived works of this project are also bound to the same licensing terms,
promoting open and collaborative software development.

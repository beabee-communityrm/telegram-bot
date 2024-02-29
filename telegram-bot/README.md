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

### Internationalisation

Our locale data is stored in
[this Google Sheet](https://docs.google.com/spreadsheets/d/1l35DW5OMi-xM8HXek5Q1jOxsXScINqqpEvPWDlpBPX8/edit#gid=0.).
We use the Google Sheets APIs to pull this directly into the repository. You
should ask another developers for their `.credentials.json` file so you can use
the process below.

#### Updating locale files

To update the locale data in the repository you run the following

```
deno task i18n
git add -A locales/ && git commit locales/ -m 'chore(i18n): Updated locales'
```

#### Using the localisation strings

```ts
import { container } from "../deps.ts";
import { I18nService } from "./services/index.ts";

const i18n = container.resolve(I18nService); // Get the Singleton instance of I18nService
const translated = i18n.t("bot.info.messages.placeholder", { placeholder: "Hello World!" }
```

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

For running the bot in production mode, execute the following command:

```bash
deno task start
```

## Project Structure

The project is organized into several main folders, each containing specific
parts of the application:

- `areas`: Contains areas from the Alosaur Framework, currently only `CoreArea`.
- `commands`: Contains classes representing each Telegram command.
- `constants` : Contains constants used throughout the application.
- `controllers`: HTTP controllers for handling requests.
- `core`: Contains abstract classes of the application, such as `Command` to
  implement a new Telegram Command and the `EventManager` to implement a new
  event manger.
- `data`: Contains data which can be persisted in docker volumes such the
  `database.sql`.
- `renderer`: Includes classes for rendering Markdown texts, including
  `CalloutRenderer`, `MessageRenderer`, `CalloutResponseRenderer` and more.
- `enums`: Contains enums used throughout the application.
- `event-managers`: This folder is dedicated to handling event-related logic. It
  contains the event handlers which are responsible for responding to various
  events triggered throughout the application. The organization of this folder
  allows for a clear and efficient handling of the event-driven aspects of the
  application.
- `models`: Contains classes representing various models used throughout the
  application using `typeorm`.
- `renderer`: Contains classes for rendering Markdown texts, including
  `CalloutRenderer`, `MessageRenderer`, `CalloutResponseRenderer` and more.
- `scripts`: Contains scripts for automation and building project components.
- `services`: Contains classes for various services such as `CalloutService` for
  retrieving callout data, `KeyboardService` for creating Telegram keyboards,
  the `CommunicationService` for sending messages to Telegram, and more.
- `types`: Contains types used throughout the application.
- `utils`: Contains helper functions, such as `escapeMd` to escape Telegram
  Markdown V2 characters, and more.

## Docker

To build the Docker image, you can use the following command:

```bash
deno task docker:build
```

And to run the Docker container, you can use the following command:

```bash
deno task docker:start
```

This assumes that your application is listening on port 8080. If it's listening
on a different port, replace `8080:8080` with `<your port>:<your port>`.

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

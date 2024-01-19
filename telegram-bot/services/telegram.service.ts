import { Bot, container, Singleton } from "../deps.ts";
import { Command } from "../core/index.ts";
import { I18nService } from "./i18n.service.ts";
import { BeabeeContentService } from "./beabee-content.service.ts";
import { readJson, waitForUrl } from "../utils/index.ts";

import type { CommandClass, EventManagerClass } from "../types/index.ts";

/**
 * TelegramService is a Singleton service that handles the Telegram bot.
 * - Initialize the bot
 * - Add commands
 * - Add event listeners using the EventManagers
 */
@Singleton()
export class TelegramService {
  bot: Bot;

  protected readonly _commands: { [key: string]: Command } = {};

  constructor(
    protected readonly i18n: I18nService,
    protected readonly beabeeContent: BeabeeContentService,
  ) {
    const token = Deno.env.get("TELEGRAM_TOKEN");
    if (!token) throw new Error("TELEGRAM_TOKEN is not set");
    this.bot = new Bot(token);

    this.bootstrap().catch(console.error);
    console.debug(`${this.constructor.name} created`);
  }

  public async changeLocale(lang: string) {
    for (const command of Object.values(this._commands)) {
      command.changeLocale(lang);
    }
    await this.updateExistingCommands();
  }

  /**
   * Bootstrap the bot asynchronously:
   * - Initialize the localization
   * - Add commands
   * - Add event listeners
   * - Start the bot
   */
  protected async bootstrap() {
    await this.printInfo();
    await this.waitForBeabee();
    await this.initBeabeeContent();
    await this.initCommands();
    await this.initEventManagers();

    // Start the bot
    this.bot.start();
  }

  protected async waitForBeabee() {
    console.debug("Waiting for Beabee...");
    const api = Deno.env.get("API_PROXY_URL")!;
    await waitForUrl(api);
    console.debug("Beabee is ready");
    return;
  }

  protected async printInfo() {
    const pkg = await readJson("./deno.json");
    console.info(`\n${pkg.name} v${pkg.version}`);

    const me = await this.bot.api.getMe();
    console.info(`\nBot will start as "${me.username}"`);
  }

  protected async initBeabeeContent() {
    const beabeeGeneralContent = await this.beabeeContent.get("general");
    console.debug("beabeeGeneralContent", beabeeGeneralContent);

    // Initialize the localization
    await this.i18n.setActiveLang(beabeeGeneralContent.locale);

    // Watch the general content for changes, changes will be broadcasted to the EventService
    this.beabeeContent.subscribe("general");

    return beabeeGeneralContent;
  }

  protected async initEventManagers() {
    const EventMangers = await import("../event-managers/index.ts");
    for (const EventManager of Object.values(EventMangers)) {
      const eventManager = container.resolve(EventManager as EventManagerClass); // Get the Singleton instance
      eventManager.init();
    }
  }

  protected async initCommands() {
    const Commands = await import("../commands/index.ts");
    await this.addCommands(Commands);
  }

  /**
   * Initialize the commands.
   * @returns
   */
  protected async initExistingCommands() {
    const commands = Object.values(this._commands);

    if (commands.length === 0) {
      console.warn("No commands found");
      return;
    }

    await this.bot.api.deleteMyCommands();

    for (const command of commands) {
      this.bot.command(command.command, command.action.bind(command));
    }

    await this.bot.api.setMyCommands(
      commands.map((command) => ({
        command: command.command,
        description: command.description,
      })),
    );
  }

  /**
   * Update the commands.
   * @returns
   */
  protected async updateExistingCommands() {
    const commands = Object.values(this._commands);

    if (commands.length === 0) {
      console.warn("No commands found");
      return;
    }

    await this.bot.api.setMyCommands(
      commands.map((command) => ({
        command: command.command,
        description: command.description,
      })),
    );
  }

  /**
   * Register new commands to the bot.
   * To define a new command, create a new class in the commands folder:
   * - The class must implement the Command interface.
   * - The class must be decorated with the @Singleton() decorator.
   * @param Commands
   */
  protected async addCommands(Commands: { [key: string]: CommandClass }) {
    for (const Command of Object.values(Commands)) {
      const command = container.resolve(Command); // Get the Singleton instance
      this._commands[command.command] = command;
    }

    await this.initExistingCommands();
  }
}

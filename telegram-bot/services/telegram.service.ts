import { container, Singleton } from "alosaur/mod.ts";
import { Bot } from "grammy/mod.ts";
import { EventService } from "./index.ts";
import { Command } from "../core/index.ts";

import type { CommandClass, EventManagerClass } from "../types/index.ts";
import type { BotCommand } from "grammy_types/mod.ts";

@Singleton()
export class TelegramService {
  bot: Bot;

  commands: { [key: string]: Command } = {};

  constructor() {
    const token = Deno.env.get("TELEGRAM_TOKEN");
    if (!token) throw new Error("TELEGRAM_TOKEN is not set");
    this.bot = new Bot(token);

    this.init().catch(console.error);
    console.debug(`${TelegramService.name} created`);
  }

  /**
   * Initialize the bot asynchronously:
   * - Add commands
   * - Add event listeners
   * - Start the bot
   */
  protected async init() {
    const Commands = await import("../commands/index.ts");
    await this.addCommands(Commands);

    const EventMangers = await import("../event-managers/index.ts");
    this.initEvents(EventMangers);

    // Start the bot
    this.bot.start();
  }

  protected initEvents(
    EventManagers: { [key: string]: EventManagerClass },
  ) {
    for (const EventManager of Object.values(EventManagers)) {
      const eventManager = container.resolve(EventManager); // Get the Singleton instance
      eventManager.init();
    }
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
      this.commands[command.command] = command;
      this.bot.command(command.command, command.action.bind(command));
    }

    const setCommands = Object.values(this.commands).map((
      { command, description },
    ) => ({ command, description } as BotCommand));
    console.debug("Setting commands", setCommands);
    // Remove all commands and set the new ones
    await this.bot.api.deleteMyCommands();
    await this.bot.api.setMyCommands(setCommands);
  }
}

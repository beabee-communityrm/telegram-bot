import { container, Singleton } from "../deps.ts";
import { Command } from "../core/index.ts";
import { I18nService } from "./i18n.service.ts";
import { BotService } from "./bot.service.ts";

import type { CommandClass } from "../types/index.ts";

@Singleton()
export class CommandService {
  protected readonly _commands: { [key: string]: Command } = {};

  constructor(
    protected readonly bot: BotService,
    protected readonly i18n: I18nService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  public async onLocaleChange(lang: string) {
    for (const command of Object.values(this._commands)) {
      command.changeLocale(lang);
    }
    await this.updateExistingCommands();
  }

  public async initCommands() {
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
      // Add this command to the list of commands only if it's visible for the current user state
      if (command.visibleOnStates.includes("start")) {
        this._commands[command.command] = command;
      }
    }

    await this.initExistingCommands();
  }
}

import { BaseCommand, BaseService } from "../core/index.ts";
import {
  BotCommand,
  BotCommandScope,
  BotCommandScopeChat,
  Singleton,
} from "../deps/index.ts";
import { I18nService } from "./i18n.service.ts";
import { BotService } from "./bot.service.ts";
import { ChatState } from "../enums/index.ts";

import type { CommandClass } from "../types/index.ts";
import { AppContext } from "../types/app-context.ts";

/**
 * Service to manage Telegram Commands like `/start`
 */
@Singleton()
export class CommandService extends BaseService {
  /** All registered commands */
  protected readonly _commands: { [command: string]: BaseCommand } = {};

  constructor(
    protected readonly bot: BotService,
    protected readonly i18n: I18nService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public async onLocaleChange(lang: string) {
    for (const command of Object.values(this._commands)) {
      command.onLocaleChange(lang);
    }

    await this.updateCommands();
  }

  /**
   * Called from the SessionEventManger after a chats session state has changed.
   * @param ctx
   * @returns
   */
  public async onSessionChanged(ctx: AppContext) {
    const session = await ctx.session;

    console.debug("Session changed", ctx.chat?.id, session);

    if (!ctx.chat?.id) {
      console.warn("No chat id found");
      return;
    }

    const scope: BotCommandScopeChat = {
      type: "chat",
      chat_id: ctx.chat.id,
    };

    await this.updateCommands({
      scope,
      commands: this.getForState(session.state),
      force: true,
    });
  }

  /**
   * Initialize all possible commands.
   * Called from the `AppService` on start.
   * @returns
   */
  public async initAllCommands() {
    console.debug("Init all commands...");
    const Commands = await this.getAllClasses();

    if (Commands.length === 0) {
      console.warn("No commands found");
      return;
    }

    for (const Command of Commands) {
      this.registerCommand(Command);
    }

    const initialCommands = this.getForState(ChatState.Initial);
    await this.updateCommands({ commands: initialCommands });
  }

  protected registerCommand(Command: CommandClass) {
    const command = Command.getSingleton();
    this.bot.command(command.command, command.action.bind(command));
    this._commands[command.command] = command;
  }

  /**
   * Update the commands.
   * @returns
   */
  protected async updateCommands(options: {
    commands?: BotCommand[];
    scope?: BotCommandScope;
    force?: boolean;
  } = {}) {
    console.debug("Update commands...");
    // Set updates
    const commands = options.commands?.map((command) => ({
      command: command.command,
      description: command.description,
    })) || (await this.bot.api.getMyCommands({
      scope: options.scope,
    })).map((command) => {
      const botCommand = this._commands[command.command];
      return {
        command: botCommand.command,
        description: botCommand.description,
      };
    }).filter((c) => c.command);

    if (commands.length === 0) {
      console.warn("No commands found");
      return;
    }

    if (options.force) {
      if (options.scope) {
        await this.bot.api.deleteMyCommands({
          scope: options.scope,
        });
      }
      // Also remove global commands
      await this.bot.api.deleteMyCommands();
    }

    console.debug("Set commands", commands);
    await this.bot.api.setMyCommands(commands, {
      scope: options.scope,
    });
  }

  public getActive(): BaseCommand[] {
    return Object.values(this._commands);
  }

  public async getAllClasses(): Promise<CommandClass[]> {
    const Commands = await import("../commands/index.ts");
    return Object.values(Commands);
  }

  public getAllRegistered(): BaseCommand[] {
    return Object.values(this._commands);
  }

  public getForState(state: ChatState): BaseCommand[] {
    const commands = this.getAllRegistered();
    return commands.filter((command) =>
      command.visibleOnStates.includes(state)
    );
  }
}

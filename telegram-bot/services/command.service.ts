import { BaseCommand, BaseService } from "../core/index.ts";
import {
  BotCommand,
  BotCommandScope,
  BotCommandScopeChat,
  Singleton,
} from "../deps/index.ts";
import { I18nService } from "./i18n.service.ts";
import { BotService } from "./bot.service.ts";
import { getSessionKey } from "../utils/index.ts";
import { StateMachineService } from "./state-machine.service.ts";
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
    protected readonly stateMachine: StateMachineService,
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
    const sessionId = getSessionKey(ctx);

    console.debug(`Session for session ID "${sessionId}" changed:`, {
      ...session,
      _data: "<hidden>",
    });

    if (!sessionId) {
      console.warn("No session id found");
      return;
    }

    if (session.state === ChatState.Start) {
      // Cancel old process for the case there is one
      await this.stateMachine.setSessionState(
        ctx,
        ChatState.Start,
        true,
      );
    }

    const scope: BotCommandScopeChat = {
      type: "chat",
      chat_id: sessionId,
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
   * @param options The options
   * @returns
   */
  protected async updateCommands(options: {
    /** The commands to update, if no commands are provided, all currently commands are updated */
    commands?: BotCommand[];
    /** The scope of the commands, if no scope is provided, the commands are global for all chats */
    scope?: BotCommandScope;
    /** Force the update */
    force?: boolean;
  } = {}) {
    console.debug("Update commands...", {
      scope: options.scope,
      force: options.force,
      commands: options.commands?.map((c) => c.command),
    });
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
      try {
        await this.bot.api.deleteMyCommands();
      } catch (error) {
        console.error("Error deleting global commands", error);
      }
    }

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
    return commands.filter((command) => {
      // If the command has no visible states, it is visible in all states
      // Otherwise, check if the state is included in the visible states
      if (
        command.visibleOnStates.length === 0 ||
        command.visibleOnStates.includes(state)
      ) {
        return true;
      }
      return false;
    });
  }
}

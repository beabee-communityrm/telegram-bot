import { BotCommand, container } from "../deps/index.ts";
import type { ChatState } from "../enums/index.ts";
import type { I18nService } from "../services/i18n.service.ts";
import type { CommunicationService } from "../services/communication.service.ts";
import type { MessageRenderer } from "../renderer/message.renderer.ts";
import type { AppContext, SessionPersisted } from "../types/index.ts";

/**
 * Base class for all bot commands
 * Any command must extend this class
 */
export abstract class BaseCommand implements BotCommand {
  /**
   * Get a singleton instance of the command.
   * This method makes use of the [dependency injection](https://alosaur.com/docs/basics/DI#custom-di-container) container to resolve the service.
   * @param this
   * @returns
   */
  static getSingleton<T extends BaseCommand>(
    // deno-lint-ignore no-explicit-any
    this: new (...args: any[]) => T,
  ): T {
    return container.resolve(this);
  }

  /**
   * The command name, without the leading slash.
   * For example: "list"
   */
  abstract command: string;
  /**
   * The command description, used in the /help command or in the Telegram command list.
   * For example: "List active Callouts"
   * This is a getter and returns the current translation of the description
   */
  get description() {
    return this.i18n.t(
      `bot.commands.${this.command}.description`,
      {},
    );
  }

  /**
   * Define the states where the command is visible. Leave empty to make it visible in all states.
   */
  abstract visibleOnStates: ChatState[];

  /**
   * The i18n service, used to translate the command name and description.
   */
  protected abstract readonly i18n: I18nService;

  /**
   * The message renderer, used to render the messages.
   */
  protected abstract readonly messageRenderer: MessageRenderer;

  /**
   * The communication service, used to send messages to the chat.
   */
  protected abstract readonly communication: CommunicationService;

  constructor() {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Check if the command is usable in the current state
   * @param session The current session
   * @returns True if the command is usable, false otherwise
   */
  public isCommandUsable(session: SessionPersisted): boolean {
    return this.visibleOnStates.length === 0 ||
      this.visibleOnStates.includes(session.state);
  }

  /**
   * Check if the command is usable in the current state. otherwise send an error message an return `false`
   * @param ctx The context of the Telegram message that triggered the command.
   * @returns True if the action can be executed, false otherwise
   */
  protected async checkAction(
    ctx: AppContext,
    quiet = false,
  ): Promise<boolean> {
    const session = await ctx.session;

    if (!this.isCommandUsable(session)) {
      if (!quiet) {
        this.communication.send(
          ctx,
          this.messageRenderer.commandNotUsable(this, session.state),
        );
      }

      // TODO: send error message
      return false;
    }

    return true;
  }

  /**
   * The action that is executed when the command is called.
   * @param ctx The context of the Telegram message that triggered the command.
   * @returns True if the command was executed successfully, false otherwise.
   */
  abstract action(ctx: AppContext): Promise<boolean>;

  /**
   * Called when the language changes.
   * @param lang The new language code.
   */
  onLocaleChange(lang: string) {
    console.debug(`[${this.constructor.name}] Language changed to "${lang}"`, {
      command: this.command,
      description: this.description,
    });
  }
}

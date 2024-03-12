import { BotCommand, container } from "../deps/index.ts";
import { ChatState } from "../enums/index.ts";
import type { I18nService } from "../services/i18n.service.ts";
import type { AppContext } from "../types/index.ts";

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

  constructor() {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * The action that is executed when the command is called.
   * @param ctx The context of the Telegram message that triggered the command.
   */
  abstract action(ctx: AppContext): Promise<void>;

  /**
   * Called when the language changes.
   * @param lang The new language code.
   */
  onLocaleChange(lang: string) {
    console.debug(`[${this.constructor.name}] Language changed to [${lang}]`, {
      command: this.command,
      description: this.description,
    });
  }
}

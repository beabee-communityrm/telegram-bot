import type { Context } from "grammy/context.ts";
import type { I18nService } from "../services/i18n.service.ts";
import type { BotCommand } from "../types/index.ts";

export abstract class Command implements BotCommand {
  /**
   * Similar to `command`, but not translatable.
   * For example: "list"
   */
  abstract key: string;
  /**
   * The command name, without the leading slash.
   * For example: "list"
   */
  abstract command: string;
  /**
   * The command description, used in the /help command or in the Telegram command list.
   * For example: "List active Callouts"
   */
  abstract description: string;

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
  abstract action(ctx: Context): Promise<void>;

  /**
   * Called when the language changes.
   * @param lang The new language code.
   */
  changeLanguage(lang: string) {
    this.command = this.i18n.t(`commands.${this.key}.command`, {}, lang);
    this.description = this.i18n.t(
      `commands.${this.key}.description`,
      {},
      lang,
    );

    console.debug(`[${this.constructor.name}] Language changed to [${lang}]`, {
      command: this.command,
      description: this.description,
    });
  }
}

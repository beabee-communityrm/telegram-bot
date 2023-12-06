import type { Context } from "grammy/context.ts";

export abstract class Command {
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
   * The action that is executed when the command is called.
   * @param ctx The context of the Telegram message that triggered the command.
   */
  abstract action(ctx: Context): Promise<void>;
}

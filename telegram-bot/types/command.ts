import type { Context } from "grammy/context.ts";
import { BotCommandScope } from '../enums/index.ts';

export interface Command {
    /**
     * The command name, without the leading slash.
     * For example: "list"
     */
    command: string;
    /**
     * The command description, used in the /help command or in the Telegram command list.
     * For example: "List active Callouts"
     */
    description: string;
    /**
     * Scope to which bot commands are applied.
     * Not yet implemented.
     */
    scope?: BotCommandScope;

    action(ctx: Context): Promise<void>;
}
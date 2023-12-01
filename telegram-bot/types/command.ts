import { TelegramService } from '../services/index.ts';
import { BotCommandScope } from '../enums/index.ts';

import type { Context } from "grammy/context.ts";

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

    // init(telegramService: TelegramService): Promise<void>;

    /**
     * The action that is executed when the command is called.
     * @param ctx The context of the Telegram message that triggered the command.
     */
    action(ctx: Context): Promise<void>;
}
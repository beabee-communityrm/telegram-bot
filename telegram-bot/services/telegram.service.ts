import { Injectable, container } from 'alosaur/mod.ts';
import { Bot, Context } from "grammy/mod.ts";

import type { CommandClass, Command } from '../types/index.ts';
import type { BotCommand } from 'grammy_types/mod.ts';

@Injectable()
export class TelegramService {

    bot: Bot;

    commands: { [key: string]: Command } = {};

    constructor() {
        const token = Deno.env.get("TELEGRAM_TOKEN");
        if (!token) throw new Error("TELEGRAM_TOKEN is not set");
        this.bot = new Bot(token);

        this.init().catch(console.error);
    }

    /**
     * Initialize the bot
     *  - Add commands
     */
    public async init() {
        const Commands = await import('../commands/index.ts');
        console.debug("Initializing bot", Commands);
        await this.addCommands(Commands);

        // Handle other messages..
        this.bot.on("message", (ctx) => ctx.reply("Unknown commend!"));

        this.addEventListeners();

        // Start the bot
        this.bot.start();
    }

    protected addEventListeners() {
        this.bot.on("callback_query:data", (ctx) => this.onCallbackQueryData(ctx));
    }

    onCallbackQueryData(ctx: Context) {
        if (!ctx.callbackQuery?.data) return;

        const callbackName = ctx.callbackQuery.data;
        if (callbackName.startsWith("show-callout-slug:")) {
            this.commands.show.action(ctx);
        }

        ctx.answerCallbackQuery(); // remove loading animation
    }

    /**
     * Register new commands to the bot.
     * To define a new command, create a new class in the commands folder:
     * - The class must implement the Command interface.
     * - The class must be decorated with the @Injectable() decorator.
     * @param Commands 
     */
    private async addCommands(Commands: { [key: string]: CommandClass }) {
        for (const Command of Object.values(Commands)) {
            const command = container.resolve(Command); // Get the Injectable instance
            this.commands[command.command] = command;
            this.bot.command(command.command, command.action.bind(command));
        }

        const setCommands = Object.values(this.commands).map(({ command, description }) => ({ command, description } as BotCommand));
        console.debug("Setting commands", setCommands);
        // Remove all commands and set the new ones
        await this.bot.api.deleteMyCommands()
        await this.bot.api.setMyCommands(setCommands);
    }
}
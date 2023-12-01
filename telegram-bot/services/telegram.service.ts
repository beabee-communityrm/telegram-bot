import { Singleton, container } from 'alosaur/mod.ts';
import { Bot } from "grammy/mod.ts";

import type { CommandClass, Command, TelegramBotEventListener } from '../types/index.ts';
import type { BotCommand } from 'grammy_types/mod.ts';
import type { Context } from "grammy/mod.ts";

@Singleton()
export class TelegramService {

    bot: Bot;

    commands: { [key: string]: Command } = {};

    protected events = new EventTarget();

    constructor() {
        const token = Deno.env.get("TELEGRAM_TOKEN");
        if (!token) throw new Error("TELEGRAM_TOKEN is not set");
        this.bot = new Bot(token);

        this.init().catch(console.error);
    }

    /**
     * Initialize the bot asynchronously:
     * - Add commands
     * - Add event listeners
     * - Start the bot
     */
    protected async init() {
        const Commands = await import('../commands/index.ts');
        await this.addCommands(Commands);

        this.addEventListeners();

        // Start the bot
        this.bot.start();
    }

    protected addEventListeners() {
        // Handle callback query data, e.g. Telegram keyboard button presses
        this.bot.on("callback_query:data", (ctx) => this.onCallbackQueryData(ctx));

        // Handle normale messages to the bot
        this.bot.on("message", (ctx) => this.onMessage(ctx));
    }

    protected onMessage(ctx: Context) {
        this.dispatchSpecificEvents("message", ctx);
    }

    /**
     * Dispatch specific callback events
     * @fires callback_query
     * @fires callback_query:user-123456789
     * @fires callback_query:data
     * @fires callback_query:data:user-123456789
     * @fires callback_query:data:show-callout-slug
     * @fires callback_query:data:show-callout-slug:user-123456789
     * @fires callback_query:data:show-callout-slug:my-callout
     * @fires callback_query:data:show-callout-slug:my-callout:user-123456789
     * @fires message
     * @fires message:user-123456789
     *
     * @param eventName E.g. "callback_query:data:show-callout-slug:my-callout"
     * @param ctx 
     */
    protected dispatchSpecificEvents(eventName: string, ctx: Context) {
        const eventNameParts = eventName.split(':');
        let specificEventName = '';
        for (const eventNamePart of eventNameParts) {
            specificEventName += specificEventName.length ? ":" + eventNamePart : eventNamePart;
            this.emit(specificEventName, ctx);

            // Add user specific event
            if (ctx.from?.id) {
                this.emit(specificEventName + ":user-" + ctx.from.id, ctx);
            }
        }
    }

    protected onCallbackQueryData(ctx: Context) {
        if (!ctx.callbackQuery?.data) return;

        // Dispatch general callback event
        this.emit("callback_query:data", ctx);

        const callbackName = ctx.callbackQuery.data;

        // Dispatch specific callback events
        this.dispatchSpecificEvents("callback_query:data:" + callbackName, ctx);
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
            this.commands[command.command] = command;
            this.bot.command(command.command, command.action.bind(command));
        }

        const setCommands = Object.values(this.commands).map(({ command, description }) => ({ command, description } as BotCommand));
        console.debug("Setting commands", setCommands);
        // Remove all commands and set the new ones
        await this.bot.api.deleteMyCommands()
        await this.bot.api.setMyCommands(setCommands);
    }

    public on(event: string, callback: TelegramBotEventListener) {
        this.events.addEventListener(event, callback as EventListener);
    }

    public once(event: string, callback: TelegramBotEventListener) {
        this.events.addEventListener(event, callback as EventListener, { once: true });
    }

    public off(event: string, callback: TelegramBotEventListener) {
        this.events.removeEventListener(event, callback as EventListener);
    }

    public emit(event: string, ctx: Context) {
        this.events.dispatchEvent(new CustomEvent(event, { detail: ctx }));
    }
}
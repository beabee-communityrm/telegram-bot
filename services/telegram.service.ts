import { Singleton, container } from 'alosaur/mod.ts';
import { Bot } from "grammy/mod.ts";
import { SubscriberService } from './subscriber.service.ts';
import * as _Commands from '../commands/index.ts';

import type { CommandClass } from '../types/index.ts';
import type { BotCommand } from 'grammy_types/mod.ts';



@Singleton()
export class TelegramService {

    bot: Bot;

    constructor(private readonly subscriber: SubscriberService) {
        const token = Deno.env.get("TELEGRAM_TOKEN");
        if(!token) throw new Error("TELEGRAM_TOKEN is not set");
        this.bot = new Bot(token);

        this.init();

        // Handle other messages..
        this.bot.on("message", (ctx) => ctx.reply("Unknown commend!"));

        // Start the bot
        this.bot.start();
    }

    /**
     * Initialize the bot
     *  - Add commands
     */
    public init() {
        const Commands = Object.values(_Commands);
        this.addCommands(Commands);
    }

    /**
     * Register new commands to the bot.
     * To define a new command, create a new class in the commands folder:
     * - The class must implement the Command interface.
     * - The class must be decorated with the @Singleton() decorator.
     * @param Commands 
     */
    private addCommands(Commands: CommandClass[]) {
        const commands: BotCommand[] = [];

        for (const Command of Commands) {
            const command = container.resolve(Command); // Get the singleton instance
            commands.push({ command: command.command, description: command.description });
            this.bot.command(command.command, command.action.bind(command));
        }

        this.bot.api.setMyCommands(commands);
    }
}
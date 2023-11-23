import { Singleton, container, instanceCachingFactory } from 'alosaur/mod.ts';
import { Bot } from "grammy/mod.ts";
import * as _Commands from '../commands/index.ts';

import type { CommandClass } from '../types/index.ts';
import type { BotCommand } from 'grammy_types/mod.ts';



@Singleton()
export class TelegramService {

    bot: Bot;

    constructor() {
        const token = Deno.env.get("TELEGRAM_TOKEN");
        if(!token) throw new Error("TELEGRAM_TOKEN is not set");
        this.bot = new Bot(token);
        
        this.init().catch(console.error);
    }

    /**
     * Initialize the bot
     *  - Add commands
     */
    public async init() {
        const Commands = Object.values(_Commands);
        await this.addCommands(Commands);

        // Handle other messages..
        this.bot.on("message", (ctx) => ctx.reply("Unknown commend!"));

        // Start the bot
        this.bot.start();
    }

    /**
     * Register new commands to the bot.
     * To define a new command, create a new class in the commands folder:
     * - The class must implement the Command interface.
     * - The class must be decorated with the @Singleton() decorator.
     * @param Commands 
     */
    private async addCommands(Commands: CommandClass[]) {
        const commands: BotCommand[] = [];

        for (const Command of Commands) {
            // See https://github.com/alosaur/alosaur/tree/master/src/injection
            const command = container.resolve(Command); // Get the singleton instance
            commands.push({ command: command.command, description: command.description });
            this.bot.command(command.command, command.action.bind(command));
        }

        await this.bot.api.setMyCommands(commands);
    }
}
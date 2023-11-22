import { Singleton } from 'alosaur/mod.ts';
import { Bot } from "grammy/mod.ts";
import { SubscriberService } from './subscriber.service.ts';

@Singleton()
export class TelegramService {

    bot: Bot;


    constructor(private readonly subscriber: SubscriberService) {
        const token = Deno.env.get("TELEGRAM_TOKEN");
        if(!token) throw new Error("TELEGRAM_TOKEN is not set");
        this.bot = new Bot(token);

        // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
        this.bot.command("start", (ctx) => ctx.reply("*Hi\\!* _Welcome_ to [beabee](https://beabee.io/)\\.", { parse_mode: "MarkdownV2" }));

        // Fake callout subscription
        this.bot.command("subscribe", async (ctx) => {
            this.subscriber.createOrUpdate(ctx)
            await ctx.reply("You are now subscribed\!");
        });

        // Fake callout unsubscribes
        this.bot.command("unsubscribe", async (ctx) => {
            this.subscriber.delete(ctx)
            await ctx.reply("You are now unsubscribed\!");
        });


        // Handle other messages..
        this.bot.on("message", (ctx) => ctx.reply("Unknown commend!"));

        // mStart the bot
        this.bot.start();
    }


}
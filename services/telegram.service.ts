import { Bot } from "grammy";

export class TelegramService {

    bot: Bot;

    /** Anonymously track subscriptions */
    subscriptions: number[] = [];

    constructor() {
        const token = Deno.env.get("TELEGRAM_TOKEN");
        if(!token) throw new Error("TELEGRAM_TOKEN is not set");
        this.bot = new Bot(token);

        // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
        this.bot.command("start", (ctx) => ctx.reply("*Hi\\!* _Welcome_ to [beabee](https://beabee.io/)\\.", { parse_mode: "MarkdownV2" }));

        // Fake callout subscription
        this.bot.command("subscribe", async (ctx) => {
            this.subscriptions.push(ctx.chat.id);
            console.debug("New subscription", ctx.chat);
            await ctx.reply("You are now subscribed\\!");
        });

        // Fake callout unsubscribes
        this.bot.command("unsubscribe", async (ctx) => {
            const index = this.subscriptions.findIndex((id) => id === ctx.chat.id);
            if(index <= -1) return await ctx.reply("You are not subscribed\!");
            this.subscriptions.splice(index, 1);
            await ctx.reply("You are now unsubscribed\\!");
        });


        // Handle other messages..
        this.bot.on("message", (ctx) => ctx.reply("Got another message!"));

        // mStart the bot
        this.bot.start();
    }
}
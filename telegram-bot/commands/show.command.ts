import { Singleton } from 'alosaur/mod.ts';
import { TelegramService } from '../services/index.ts';
import { CalloutService, RenderService } from '../services/index.ts';

import type { Context } from "grammy/context.ts";
import type { Command } from '../types/command.ts';

@Singleton()
export class ShowCommand implements Command {
    command = 'show';
    description = `Shows you information about a specific callout`;

    constructor(protected readonly callout: CalloutService, protected readonly render: RenderService, protected readonly telegramService: TelegramService) {
        // Listen for the callback query data event with the `show-callout-slug` data
        telegramService.on("callback_query:data:show-callout-slug", (event) => {
            this.onShowCalloutButtonPressed(event.detail);
        });
    }

    async onShowCalloutButtonPressed(ctx: Context) {
        await this.action(ctx);
        await ctx.answerCallbackQuery(); // remove loading animation
    }

    // Handle the /show command
    async action(ctx: Context) {
        console.debug("Show command called");

        // Get the slug from the `/show slug` message text or from the callback query data
        const slug = ctx.message?.text?.split(' ')[1] || ctx.callbackQuery?.data?.split(':')[1];
        console.debug("Slug", slug);

        if (!slug) {
            await ctx.reply("Please specify a callout slug. E.g. `/show my-callout`");
            return;
        }

        try {
            const callout = await this.callout.get(slug);
            console.debug("Got callout", callout);

            const res = await this.render.callout(callout);
            await this.render.reply(ctx, res);
        } catch (error) {
            console.error("Error sending callout", error);
            await ctx.reply("Error sending callout");
        }
    }
}
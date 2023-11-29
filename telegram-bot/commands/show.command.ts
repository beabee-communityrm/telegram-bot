import { Singleton, container } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { CalloutService, TelegramService } from '../services/index.ts';
import { escapeMd } from '../utils/index.ts';

import type { Context } from "grammy/context.ts";

@Singleton()
export class ShowCommand implements Command {
    command = 'show';
    description = `Shows you information about a specific callout. If you want to see what active callouts are available, use '/list'.`;

    constructor(protected readonly callout: CalloutService) {

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

        const callout = await this.callout.get(slug);
        console.debug("Got callout", callout);

        // Send the callout excerpt
        // TODO: Send the full callout with title, image and excerpt
        await ctx.reply(callout.excerpt);
    }
}
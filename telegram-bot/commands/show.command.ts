import { Injectable } from 'alosaur/mod.ts';
import { InputMediaBuilder, InputFile } from "grammy/mod.ts";
import { CalloutService, RenderService } from '../services/index.ts';
import { escapeMd, downloadImage } from '../utils/index.ts';

import type { Context } from "grammy/context.ts";
import type { Command } from '../types/command.ts';

@Injectable()
export class ShowCommand implements Command {
    command = 'show';
    description = `Shows you information about a specific callout`;

    constructor(protected readonly callout: CalloutService, protected readonly render: RenderService) {
        //...
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

            const { photo } = await this.render.callout(callout);

            await ctx.replyWithMediaGroup([photo]);
        } catch (error) {
            console.error("Error sending callout", error);
            await ctx.reply("Error sending callout");
        }
    }
}
import { Singleton, container } from 'alosaur/mod.ts';
import { InputMediaBuilder, InputFile } from "grammy/mod.ts";
import { CalloutService, TelegramService } from '../services/index.ts';
import { escapeMd, downloadImage } from '../utils/index.ts';

import type { Context } from "grammy/context.ts";
import type { Command } from '../types/command.ts';

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

        try {
            const callout = await this.callout.get(slug);
            console.debug("Got callout", callout);

            const imagePath = await downloadImage(callout.image);
            const inputFile = new InputFile(await Deno.open(imagePath), callout.title);

            // TODO: Add URL to callout
            const captionMd = `*${escapeMd(callout.title)}*\n\n${escapeMd(callout.excerpt)}`;
            const calloutImage = InputMediaBuilder.photo(inputFile, { caption: captionMd, parse_mode: "MarkdownV2" });

            await ctx.replyWithMediaGroup([calloutImage]);
        } catch (error) {
            console.error("Error sending callout", error);
            await ctx.reply("Error sending callout");
        }
    }
}
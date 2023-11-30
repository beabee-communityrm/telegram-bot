import { Injectable } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { CalloutService, RenderService } from '../services/index.ts';
import { escapeMd } from '../utils/index.ts';
import { InlineKeyboard } from "grammy/mod.ts";

import type { Context } from "grammy/context.ts";

@Injectable()
export class ListCommand implements Command {
    command = 'list';
    description = 'List active Callouts';

    constructor(protected readonly callout: CalloutService, protected readonly render: RenderService) {
        //...
    }

    // Handle the /list command
    async action(ctx: Context) {
        const callouts = await this.callout.list();

        if (callouts.items.length === 0) {
            await ctx.reply('There are currently no active callouts');
            return;
        }

        const { markdown } = this.render.calloutListItems(callouts.items);

        console.debug("Sending message", markdown);

        await ctx.reply(markdown, { parse_mode: "MarkdownV2" });

        const inlineKeyboard = new InlineKeyboard();
        for (let i = 0; i < callouts.items.length; i++) {
            inlineKeyboard.text(`${i + 1}`, `show-callout-slug:${callouts.items[i].slug}`);
        }
        const keyboardMessageMd = `_${escapeMd('Which callout would you like to get more information displayed about? Choose a number')}_`;

        await ctx.reply(keyboardMessageMd, {
            reply_markup: inlineKeyboard,
            parse_mode: "MarkdownV2"
        });

    }
}
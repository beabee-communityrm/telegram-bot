import { Injectable } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { CalloutService, RenderService, KeyboardService } from '../services/index.ts';
import { escapeMd } from '../utils/index.ts';
import { InlineKeyboard } from "grammy/mod.ts";

import type { Context } from "grammy/context.ts";

@Injectable()
export class ListCommand implements Command {
    command = 'list';
    description = 'List active Callouts';

    constructor(protected readonly callout: CalloutService, protected readonly render: RenderService, protected readonly keyboard: KeyboardService) {
        //...
    }

    // Handle the /list command
    async action(ctx: Context) {
        const callouts = await this.callout.list();

        if (callouts.items.length === 0) {
            await ctx.reply('There are currently no active callouts');
            return;
        }

        const res = this.render.calloutListItems(callouts.items);
        await this.render.reply(ctx, res);

        console.debug("Sending message", res);

        const keyboard = this.keyboard.calloutSelection(callouts.items);
        const keyboardMessageMd = `_${escapeMd('Which callout would you like to get more information displayed about? Choose a number')}_`;

        await ctx.reply(keyboardMessageMd, {
            reply_markup: keyboard,
            parse_mode: "MarkdownV2"
        });

    }
}
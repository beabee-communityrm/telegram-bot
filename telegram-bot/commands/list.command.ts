import { Singleton } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { CalloutService } from '../services/callout.service.ts';
import { escapeMd } from '../utils/index.ts';

import type { Context } from "grammy/context.ts";

@Singleton()
export class ListCommand implements Command {
    command = 'list';
    description = 'List active Callouts';

    constructor(protected readonly callout: CalloutService) {
        //...
    }

    // Handle the /list command
    async action(ctx: Context) {
        const calloutsMd = await this.callout.list();

        const infoMessage = `_${escapeMd('Which callout would you like to get more information displayed about? Type in the number and send it to me.')}_`;

        const message = `${calloutsMd}\n\n${infoMessage}`;

        console.debug("Sending message", message);

        ctx.hasCommand

        await ctx.reply(message, { parse_mode: "MarkdownV2" });
    }
}
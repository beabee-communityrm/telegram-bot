import { Singleton } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { CalloutClient } from '@beabee/client';

import type { Context } from "grammy/context.ts";

@Singleton()
export class ListCommand implements Command {
    command = 'list';
    description = 'List active Callouts';

    callout: CalloutClient;

    constructor() {
        const host = Deno.env.get("BEABEE_API_BASE_HOST") || "http://localhost:3001";
        const path = Deno.env.get("BEABEE_API_BASE_PATH") || "/api/1.0/";
        const token = Deno.env.get("BEABEE_API_TOKEN");

        if (!token) {
            throw new Error("BEABEE_API_TOKEN is required");
        }

        this.callout = new CalloutClient({ path, host, token });
    }


    // Handle the /list command
    async action(ctx: Context) {
        const callouts = await this.callout.list();
        console.debug("callouts", callouts);

        let text = "*List of active callouts:*\n";

        for (const item of callouts.items) {
            text += `\\- [${item.title.replaceAll('-', '\\-')}](${item.slug})\n`;
        }

        await ctx.reply(text, { parse_mode: "MarkdownV2" });
    }
}
import { Singleton } from 'alosaur/mod.ts';
import { CalloutService, RenderService, KeyboardService, EventService } from '../services/index.ts';
import { ApiError } from '@beabee/client';
import { escapeMd } from '../utils/index.ts';

import type { Context } from "grammy/context.ts";
import type { Command } from '../types/command.ts';

@Singleton()
export class ShowCommand implements Command {
    command = 'show';
    description = `Shows you information about a specific callout`;

    constructor(
        protected readonly callout: CalloutService,
        protected readonly render: RenderService,
        protected readonly keyboard: KeyboardService,
        protected readonly event: EventService
    ) {
        this.addEventListeners();
    }

    protected addEventListeners() {
        // Listen for the callback query data event with the `callout-respond:yes` data
        this.event.on("callback_query:data:callout-respond-slug", (event) => {
            this.onCalloutRespondKeyboardPressed(event.detail);
        });
    }

    protected async onCalloutRespondKeyboardPressed(ctx: Context) {
        const data = ctx.callbackQuery?.data?.split(':');
        const slug = data?.[1];
        const response = data?.[2] as 'yes' | 'no';

        if (!slug || !response) {
            await ctx.reply("This button has not a callout slug associated with it");
            return;
        }

        if (response === 'no') {
            await ctx.reply("Ok, no problem");
            await ctx.answerCallbackQuery(); // remove loading animation
            return;
        }

        if (response !== 'yes') {
            await ctx.reply("This button has not a valid response associated with it");
            return;
        }

        // Yes response
        const calloutWithForm = await this.callout.get(slug, ["form"]);
        console.debug("Got callout with form", calloutWithForm);

        const res = this.render.calloutResponse(calloutWithForm, 0);
        await this.render.reply(ctx, res);

        await ctx.answerCallbackQuery(); // remove loading animation
    }

    // Handle the /show command
    async action(ctx: Context) {
        console.debug("Show command called");

        // Get the slug from the `/show slug` message text
        const slug = ctx.message?.text?.split(' ')[1];

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
            if (error instanceof ApiError && error.httpCode === 404) {
                await ctx.reply(`Callout with slug "${slug}" not found.`);
                return;
            }
            await ctx.reply(`Error sending callout slug "${slug}": ${error.message}`);
            return;
        }

        const keyboardMessageMd = `_${escapeMd('Would you like to respond to the callout?')}_`;
        const yesNoKeyboard = this.keyboard.yesNo(`callout-respond-slug:${slug}`);

        await ctx.reply(keyboardMessageMd, {
            reply_markup: yesNoKeyboard,
            parse_mode: "MarkdownV2"
        });
    }
}
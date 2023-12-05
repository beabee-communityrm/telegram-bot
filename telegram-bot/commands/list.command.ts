import { Singleton } from "alosaur/mod.ts";
import { Command } from "../types/command.ts";
import {
  CalloutService,
  EventService,
  KeyboardService,
  RenderService,
} from "../services/index.ts";
import { CalloutRenderer } from "../renderer/index.ts";
import { escapeMd } from "../utils/index.ts";

import type { Context } from "grammy/context.ts";

@Singleton()
export class ListCommand implements Command {
  command = "list";
  description = "List active Callouts";

  constructor(
    protected readonly callout: CalloutService,
    protected readonly render: RenderService,
    protected readonly keyboard: KeyboardService,
    protected readonly event: EventService,
    protected readonly calloutRenderer: CalloutRenderer,
  ) {
    this.addEventListeners();
  }

  protected addEventListeners() {
    // Listen for the callback query data event with the `show-callout-slug` data
    this.event.on("callback_query:data:show-callout-slug", (event) => {
      this.onCalloutSelectionKeyboardPressed(event.detail);
    });
  }

  protected async onCalloutSelectionKeyboardPressed(ctx: Context) {
    const slug = ctx.callbackQuery?.data?.split(":")[1];

    if (!slug) {
      await ctx.reply("This button has not a callout slug associated with it");
      return;
    }

    try {
      const callout = await this.callout.get(slug);
      console.debug("Got callout", callout);

      const res = await this.calloutRenderer.callout(callout);
      await this.render.reply(ctx, res);
    } catch (error) {
      console.error("Error sending callout", error);
      await ctx.reply("Error sending callout");
    }

    await ctx.answerCallbackQuery(); // remove loading animation
  }

  // Handle the /list command
  public async action(ctx: Context) {
    const callouts = await this.callout.list();

    if (callouts.items.length === 0) {
      await ctx.reply("There are currently no active callouts");
      return;
    }

    const res = this.calloutRenderer.listItems(callouts.items);
    await this.render.reply(ctx, res);

    const keyboard = this.keyboard.calloutSelection(callouts.items);
    const keyboardMessageMd = `_${
      escapeMd(
        "Which callout would you like to get more information displayed about? Choose a number",
      )
    }_`;

    await ctx.reply(keyboardMessageMd, {
      reply_markup: keyboard,
      parse_mode: "MarkdownV2",
    });
  }
}

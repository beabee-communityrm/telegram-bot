import { Singleton } from "alosaur/mod.ts";
import {
  CalloutService,
  EventService,
  KeyboardService,
  RenderService,
} from "../services/index.ts";
import {
  CalloutRenderer,
  CalloutResponseRenderer,
  MessageRenderer,
} from "../renderer/index.ts";
import { ApiError } from "@beabee/client";
import { escapeMd } from "../utils/index.ts";
import {
  BUTTON_CALLBACK_CALLOUT_INTRO,
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
} from "../constants.ts";

import type { Context } from "grammy/context.ts";
import type { Command } from "../types/command.ts";

@Singleton()
export class ShowCommand implements Command {
  command = "show";
  description = `Shows you information about a specific callout`;

  constructor(
    protected readonly callout: CalloutService,
    protected readonly render: RenderService,
    protected readonly keyboard: KeyboardService,
    protected readonly event: EventService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly calloutResponseRenderer: CalloutResponseRenderer,
  ) {
    this.addEventListeners();
  }

  protected addEventListeners() {
    // Listen for the callback query data event with the `callout-respond:yes` data
    this.event.on(
      `callback_query:data:${BUTTON_CALLBACK_CALLOUT_INTRO}`,
      (event) => {
        this.onCalloutIntroKeyboardPressed(event.detail);
      },
    );

    this.event.on(
      `callback_query:data:${BUTTON_CALLBACK_CALLOUT_PARTICIPATE}`,
      (event) => {
        this.onCalloutParticipateKeyboardPressed(event.detail);
      },
    );
  }

  protected async onCalloutParticipateKeyboardPressed(ctx: Context) {
    const data = ctx.callbackQuery?.data?.split(":");
    const slug = data?.[1];
    const startResponse = data?.[2] as "continue" | "cancel" === "continue";

    if (!startResponse) {
      await this.render.reply(ctx, this.messageRenderer.stop());
      await ctx.answerCallbackQuery(); // remove loading animation
      return;
    }

    if (!slug) {
      await this.render.reply(ctx, this.messageRenderer.calloutNotFound());
      await ctx.answerCallbackQuery(); // remove loading animation
      return;
    }

    console.debug(
      "onCalloutParticipateKeyboardPressed",
      data,
      slug,
      startResponse,
    );

    // Start intro
    const calloutWithForm = await this.callout.get(slug, ["form"]);
    console.debug("Got callout with form", calloutWithForm);

    const res = this.calloutResponseRenderer.response(calloutWithForm, 0);
    await this.render.reply(ctx, res);
    await ctx.answerCallbackQuery(); // remove loading animation
  }

  /**
   * Handle the callback query data event with the `callout-respond:yes` or `callout-respond:no` data.
   * Called when the user presses the "Yes" or "No" button on the callout response keyboard.
   * @param ctx
   */
  protected async onCalloutIntroKeyboardPressed(ctx: Context) {
    const data = ctx.callbackQuery?.data?.split(":");
    const slug = data?.[1];
    const startIntro = data?.[2] as "yes" | "no" === "yes";

    if (!slug) {
      await this.render.reply(ctx, this.messageRenderer.calloutNotFound());
      await ctx.answerCallbackQuery(); // remove loading animation
      return;
    }

    if (!startIntro) {
      await this.render.reply(ctx, this.messageRenderer.stop());
      await ctx.answerCallbackQuery(); // remove loading animation
      return;
    }

    // Start intro
    const calloutWithForm = await this.callout.get(slug, ["form"]);
    console.debug("Got callout with form", calloutWithForm);

    const res = this.calloutResponseRenderer.intro(calloutWithForm);
    await this.render.reply(ctx, res);
    await ctx.answerCallbackQuery(); // remove loading animation
  }

  // Handle the /show command
  async action(ctx: Context) {
    console.debug("Show command called");

    // Get the slug from the `/show slug` message text
    const slug = ctx.message?.text?.split(" ")[1];

    if (!slug) {
      await ctx.reply("Please specify a callout slug. E.g. `/show my-callout`");
      return;
    }

    try {
      const callout = await this.callout.get(slug);
      console.debug("Got callout", callout);

      const res = await this.calloutRenderer.callout(callout);
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

    // TODO: Move to render service
    const keyboardMessageMd = `_${
      escapeMd("Would you like to respond to the callout?")
    }_`;
    const yesNoKeyboard = this.keyboard.yesNo(
      `${BUTTON_CALLBACK_CALLOUT_INTRO}:${slug}`,
    );

    await ctx.reply(keyboardMessageMd, {
      reply_markup: yesNoKeyboard,
      parse_mode: "MarkdownV2",
    });
  }
}

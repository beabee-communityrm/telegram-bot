import { Singleton } from "alosaur/mod.ts";
import { CalloutService } from "../services/callout.service.ts";
import { RenderService } from "../services/render.service.ts";
import { EventService } from "../services/event.service.ts";
import { CalloutResponseRenderer, MessageRenderer } from "../renderer/index.ts";
import {
  BUTTON_CALLBACK_CALLOUT_INTRO,
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
} from "../constants.ts";
import { EventManager } from "../core/event-manager.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class CalloutResponseEventManager extends EventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly callout: CalloutService,
    protected readonly render: RenderService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutResponseRenderer: CalloutResponseRenderer,
  ) {
    super();
    console.debug(`${CalloutResponseEventManager.name} created`);
  }

  public init() {
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

    await ctx.answerCallbackQuery(); // remove loading animation

    if (!startResponse) {
      await this.render.reply(ctx, this.messageRenderer.stop());
      return;
    }

    if (!slug) {
      await this.render.reply(ctx, this.messageRenderer.calloutNotFound());
      return;
    }

    console.debug(
      "onCalloutParticipateKeyboardPressed",
      data,
      slug,
      startResponse,
    );

    // Start callout response for first slide
    const calloutWithForm = await this.callout.get(slug, ["form"]);
    console.debug("Got callout with form", calloutWithForm);

    const answerMessages = await this.calloutResponseRenderer
      .responseAndWaitForMessage(ctx, calloutWithForm);
    console.debug("Got answer", answerMessages.map((m) => m.text));
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

    await ctx.answerCallbackQuery(); // remove loading animation

    if (!slug) {
      await this.render.reply(ctx, this.messageRenderer.calloutNotFound());
      return;
    }

    if (!startIntro) {
      await this.render.reply(ctx, this.messageRenderer.stop());
      return;
    }

    // Start intro
    const calloutWithForm = await this.callout.get(slug, ["form"]);
    console.debug("Got callout with form", calloutWithForm);

    const res = this.calloutResponseRenderer.intro(calloutWithForm);
    await this.render.reply(ctx, res);
  }
}

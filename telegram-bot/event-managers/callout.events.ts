import { Singleton } from "alosaur/mod.ts";
import { CalloutService } from "../services/callout.service.ts";
import { RenderService } from "../services/render.service.ts";
import { CalloutRenderer } from "../renderer/index.ts";
import { EventService } from "../services/event.service.ts";
import { BUTTON_CALLBACK_SHOW_CALLOUT } from "../constants/index.ts";
import { EventManager } from "../core/event-manager.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class CalloutEventManager extends EventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly callout: CalloutService,
    protected readonly render: RenderService,
    protected readonly calloutRenderer: CalloutRenderer,
  ) {
    super();
    console.debug(`${CalloutEventManager.name} created`);
  }

  public init() {
    // Listen for the callback query data event with the `BUTTON_CALLBACK_SHOW_CALLOUT` data
    this.event.on(
      `callback_query:data:${BUTTON_CALLBACK_SHOW_CALLOUT}`,
      (event) => {
        this.onCalloutSelectionKeyboardPressed(event.detail);
      },
    );
  }

  protected async onCalloutSelectionKeyboardPressed(ctx: Context) {
    const shortSlug = ctx.callbackQuery?.data?.split(":")[1];

    if (!shortSlug) {
      await ctx.reply("This button has not a callout slug associated with it");
      return;
    }

    const slug = this.callout.getSlug(shortSlug);

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
}

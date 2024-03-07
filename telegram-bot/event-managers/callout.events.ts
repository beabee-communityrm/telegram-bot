import { Context, Singleton } from "../deps.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { CalloutRenderer } from "../renderer/index.ts";
import { EventService } from "../services/event.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { BUTTON_CALLBACK_SHOW_CALLOUT } from "../constants/index.ts";
import { BaseEventManager } from "../core/base.events.ts";

@Singleton()
export class CalloutEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly keyboard: KeyboardService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    // Listen for the callback query data event with the `BUTTON_CALLBACK_SHOW_CALLOUT` data
    this.event.on(
      `callback_query:data:${BUTTON_CALLBACK_SHOW_CALLOUT}`,
      (event) => {
        this.onCalloutSelectionKeyboardPressed(event);
      },
    );
  }

  protected async onCalloutSelectionKeyboardPressed(ctx: Context) {
    const shortSlug = ctx.callbackQuery?.data?.split(":")[1];

    // Remove the inline keyboard
    await this.keyboard.removeInlineKeyboard(ctx);

    const noSlugMessage =
      "This button has not a callout slug associated with it";

    if (!shortSlug) {
      await ctx.reply(noSlugMessage);
      return;
    }

    const slug = this.callout.getSlug(shortSlug);

    if (!slug) {
      await ctx.reply(noSlugMessage);
      return;
    }

    try {
      const callout = await this.callout.get(slug);

      const calloutFormRender = await this.calloutRenderer.callout(
        callout,
      );
      await this.communication.sendAndReceiveAll(ctx, calloutFormRender);
    } catch (error) {
      console.error("Error sending callout", error);
      await ctx.reply("Error sending callout");
    }

    await this.communication.answerCallbackQuery(ctx); // remove loading animation
  }
}

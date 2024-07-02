import { Singleton } from "../deps/index.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { CalloutRenderer } from "../renderer/index.ts";
import { EventService } from "../services/event.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import {
  INLINE_BUTTON_CALLBACK_PREFIX,
  INLINE_BUTTON_CALLBACK_SHOW_CALLOUT,
} from "../constants/index.ts";
import { BaseEventManager } from "../core/base.events.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class CalloutEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly keyboard: KeyboardService,
    protected readonly stateMachine: StateMachineService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    // Listen for the callback query data event with the `INLINE_BUTTON_CALLBACK_SHOW_CALLOUT` data
    this.event.on(
      `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_SHOW_CALLOUT}`,
      (event) => {
        this.onCalloutSelectionKeyboardPressed(event);
      },
    );
  }

  protected async onCalloutSelectionKeyboardPressed(ctx: AppContext) {
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
      const callout = await this.callout.get(slug, ["form"]);
      const calloutDetailsRender = await this.calloutRenderer.calloutDetails(
        callout,
      );
      const calloutIntroRender = this.calloutRenderer.intro(
        callout,
      );
      const calloutStartResponseKeyboard = this.calloutRenderer
        .startResponseKeyboard(
          callout,
        );

      const signal = await this.stateMachine.setSessionState(
        ctx,
        ChatState.CalloutDetails,
        true,
      );

      if (!signal) {
        throw new Error("The AbortSignal is required!");
      }

      await this.communication.sendAndReceiveAll(
        ctx,
        [
          calloutDetailsRender,
          calloutIntroRender,
          calloutStartResponseKeyboard,
        ],
        signal,
      );
    } catch (error) {
      console.error("Error sending callout", error);
      await ctx.reply("Error sending callout");
    }
  }
}

import { Singleton } from "../deps/index.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { CalloutRenderer, MessageRenderer } from "../renderer/index.ts";
import { EventService } from "../services/event.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { ListCommand } from "../commands/list.command.ts";
import {
  FALSY_MESSAGE_KEY,
  INLINE_BUTTON_CALLBACK_CALLOUT_LIST,
  INLINE_BUTTON_CALLBACK_PREFIX,
  INLINE_BUTTON_CALLBACK_SHOW_CALLOUT,
  TRUTHY_MESSAGE_KEY,
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
    protected readonly messageRenderer: MessageRenderer,
    protected readonly keyboard: KeyboardService,
    protected readonly stateMachine: StateMachineService,
    protected readonly listCommand: ListCommand,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    // Listen for the callback query data event with the `INLINE_BUTTON_CALLBACK_SHOW_CALLOUT` data
    this.event.on(
      `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_SHOW_CALLOUT}`,
      (event) => {
        this.onShowCalloutKeyboardPressed(event);
      },
    );

    this.event.on(
      `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_CALLOUT_LIST}`,
      (event) => {
        this.onListCalloutsKeyboardPressed(event);
      },
    );
  }

  protected async onShowCalloutKeyboardPressed(ctx: AppContext) {
    const id = ctx.callbackQuery?.data?.split(":")[1];

    // Remove the inline keyboard
    await this.keyboard.removeInlineKeyboard(ctx);

    if (!id) {
      await ctx.reply("This button has not a callout id associated with it");
      return;
    }

    try {
      const callout = await this.callout.get(id, ["form"]);
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

  protected async onListCalloutsKeyboardPressed(ctx: AppContext) {
    const data = ctx.callbackQuery?.data?.split(":");

    // Remove the inline keyboard
    await this.keyboard.removeInlineKeyboard(ctx);

    const doShowList =
      data?.[1] as typeof TRUTHY_MESSAGE_KEY | typeof FALSY_MESSAGE_KEY ===
        TRUTHY_MESSAGE_KEY;

    // remove loading animation
    await this.communication.answerCallbackQuery(ctx);

    if (!doShowList) {
      await this.communication.send(ctx, this.messageRenderer.stop());
      await this.communication.send(ctx, this.messageRenderer.howToShowHelp());
      return;
    }

    return await this.listCommand.action(ctx, true);
  }
}

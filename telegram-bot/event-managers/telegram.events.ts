import { Singleton } from "../deps/index.ts";
import { EventService } from "../services/event.service.ts";
import { BotService } from "../services/bot.service.ts";
import { BaseEventManager } from "../core/base.events.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class TelegramEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly bot: BotService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Forward Telegram bot events to the EventService
   */
  public init() {
    // Forward callback query data, e.g. Telegram keyboard button presses
    this.bot.on(
      "callback_query:data",
      (ctx) => this.onCallbackQueryData(ctx),
    );

    // Forward normale messages from the bot
    this.bot.on("message", (ctx) => this.onMessage(ctx));
  }

  protected onMessage(ctx: AppContext) {
    this.event.emitDetailedEvents("message", ctx);
  }

  protected onCallbackQueryData(ctx: AppContext) {
    if (!ctx.callbackQuery?.data) {
      // Dispatch general callback event
      this.event.emit("callback_query:data", ctx);
      return;
    }

    // Dispatch specific callback events
    this.event.emitDetailedEvents(
      "callback_query:data:" + ctx.callbackQuery.data,
      ctx,
    );
  }
}

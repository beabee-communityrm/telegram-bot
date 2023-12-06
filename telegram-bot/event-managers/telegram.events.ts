import { Singleton } from "alosaur/mod.ts";
import { EventService } from "../services/event.service.ts";
import { TelegramService } from "../services/index.ts";
import { EventManager } from "../core/event-manager.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class TelegramEventManager extends EventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly telegramService: TelegramService,
  ) {
    super();
    console.debug(`${TelegramEventManager.name} created`);
  }

  /**
   * Forward Telegram bot events to the EventService
   */
  public init() {
    // Forward callback query data, e.g. Telegram keyboard button presses
    this.telegramService.bot.on(
      "callback_query:data",
      (ctx) => this.onCallbackQueryData(ctx),
    );

    // Forward normale messages from the bot
    this.telegramService.bot.on("message", (ctx) => this.onMessage(ctx));
  }

  protected onMessage(ctx: Context) {
    this.event.emitDetailedEvents("message", ctx);
  }

  protected onCallbackQueryData(ctx: Context) {
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

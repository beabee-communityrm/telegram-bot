import { Singleton } from "alosaur/mod.ts";
import { TelegramService } from "./index.ts";

import type { TelegramBotEventListener } from "../types/index.ts";
import type { Context } from "grammy/mod.ts";

/**
 * Handle Telegram bot events
 */
@Singleton()
export class EventService {
  protected events = new EventTarget();

  /**
   * Forward Telegram bot events to the EventService
   * @param telegramService
   */
  public addTelegramEventListeners(telegramService: TelegramService) {
    // Forward callback query data, e.g. Telegram keyboard button presses
    telegramService.bot.on(
      "callback_query:data",
      (ctx) => this.onCallbackQueryData(ctx),
    );

    // Forward normale messages from the bot
    telegramService.bot.on("message", (ctx) => this.onMessage(ctx));
  }

  protected onMessage(ctx: Context) {
    this.emitDetailedEvents("message", ctx);
  }

  protected onCallbackQueryData(ctx: Context) {
    if (!ctx.callbackQuery?.data) {
      // Dispatch general callback event
      this.emit("callback_query:data", ctx);
      return;
    }

    // Dispatch specific callback events
    this.emitDetailedEvents(
      "callback_query:data:" + ctx.callbackQuery.data,
      ctx,
    );
  }

  /**
   * Emits a series of detailed events based on a given event name.
   * The method takes an event name, splits it by the ':' character,
   * and emits progressively more detailed events for each segment.
   * @param eventName E.g. "callback_query:data:show-callout-slug:my-callout"
   * @param ctx The Telegram context
   *
   * For example, given the event name 'callback_query:data:show-callout-slug:my-callout',
   * it emits the following events in order:
   * @fires callback_query
   * @fires callback_query:user-123456789
   * @fires callback_query:data
   * @fires callback_query:data:user-123456789
   * @fires callback_query:data:show-callout-slug
   * @fires callback_query:data:show-callout-slug:user-123456789
   * @fires callback_query:data:show-callout-slug:my-callout
   * @fires callback_query:data:show-callout-slug:my-callout:user-123456789
   *
   * Or given the event name 'message', it emits the following events in order:
   * @fires message
   * @fires message:user-123456789
   */
  public emitDetailedEvents(eventName: string, ctx: Context) {
    const eventNameParts = eventName.split(":");
    let specificEventName = "";
    for (const eventNamePart of eventNameParts) {
      specificEventName += specificEventName.length
        ? ":" + eventNamePart
        : eventNamePart;
      this.emit(specificEventName, ctx);

      // Add user specific event
      if (ctx.from?.id) {
        this.emit(specificEventName + ":user-" + ctx.from.id, ctx);
      }
    }
  }

  public on(event: string, callback: TelegramBotEventListener) {
    this.events.addEventListener(event, callback as EventListener);
  }

  public once(event: string, callback: TelegramBotEventListener) {
    this.events.addEventListener(event, callback as EventListener, {
      once: true,
    });
  }

  public off(event: string, callback: TelegramBotEventListener) {
    this.events.removeEventListener(event, callback as EventListener);
  }

  public emit(event: string, ctx: Context) {
    this.events.dispatchEvent(new CustomEvent(event, { detail: ctx }));
  }
}

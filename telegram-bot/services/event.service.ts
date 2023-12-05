import { Singleton } from "alosaur/mod.ts";
import { TelegramService } from "./index.ts";

import type {
  TelegramBotEvent,
  TelegramBotEventListener,
} from "../types/index.ts";
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
    const emittedEvents: { res: boolean; eventName: string }[] = [];
    let specificEventName = "";
    for (const eventNamePart of eventNameParts) {
      specificEventName += specificEventName.length
        ? ":" + eventNamePart
        : eventNamePart;
      let res = this.emit(specificEventName, ctx);

      emittedEvents.push({
        res,
        eventName: specificEventName,
      });

      // Add user specific event
      if (ctx.from?.id) {
        res = this.emit(specificEventName + ":user-" + ctx.from.id, ctx);

        emittedEvents.push({
          res,
          eventName: specificEventName,
        });
      }
    }

    return emittedEvents;
  }

  /**
   * Emit / dispatch a Telegram bot event
   * @param eventName
   * @param ctx
   */
  public emit(eventName: string, ctx: Context) {
    return this.events.dispatchEvent(
      new CustomEvent(eventName, { detail: ctx }),
    );
  }

  /**
   * Listen for a Telegram bot event
   * @param eventName
   * @param ctx
   */
  public on(eventName: string, callback: TelegramBotEventListener) {
    return this.events.addEventListener(eventName, callback as EventListener);
  }

  /**
   * Listen for a Telegram bot event, but only once
   * @param eventName
   * @returns
   */
  public once(eventName: string, callback: TelegramBotEventListener) {
    return this.events.addEventListener(eventName, callback as EventListener, {
      once: true,
    });
  }

  /**
   * Returns a promise that resolves when the given event is emitted
   * @param eventName
   * @returns
   */
  public onceAsync(eventName: string): Promise<TelegramBotEvent> {
    return new Promise((resolve) => {
      this.on(eventName, (event) => {
        resolve(event);
      });
    });
  }

  /**
   * Stop listening for a Telegram bot event
   * @param eventName
   * @param ctx
   */
  public off(eventName: string, callback: TelegramBotEventListener) {
    return this.events.removeEventListener(
      eventName,
      callback as EventListener,
    );
  }

  /**
   * Listen for a Telegram user message
   * @param id
   * @param callback
   */
  public onUserMessage(id: number, callback: TelegramBotEventListener) {
    return this.on("message:user-" + id, callback);
  }

  public onceUserMessage(id: number, callback: TelegramBotEventListener) {
    return this.once("message:user-" + id, callback);
  }

  public async onceUserMessageAsync(id: number): Promise<TelegramBotEvent> {
    return await this.onceAsync("message:user-" + id) as TelegramBotEvent;
  }

  public offUserMessage(id: number, callback: TelegramBotEventListener) {
    return this.off("message:user-" + id, callback);
  }
}

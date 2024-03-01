import { Singleton } from "../deps.ts";

import type {
  EventTelegramBot,
  EventTelegramBotListener,
  Listener,
} from "../types/index.ts";
import type { Context } from "grammy/mod.ts";

// deno-lint-ignore no-explicit-any
class EventDispatcher<T = any> {
  private listeners: { [event: string]: Listener<T>[] } = {};

  /** Register a listener for a specific event */
  public on(event: string, callback: Listener<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /** Remove a listener for a specific event */
  public off(event: string, callback: Listener<T>): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter((listener) =>
      listener !== callback
    );
  }

  /** Dispatch an event to all registered listeners */
  public dispatch(event: string, data: T): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((listener) => listener(data));
    // Automatically remove listeners registered with `once`
    this.listeners[event] = this.listeners[event].filter((listener) =>
      !listener.once
    );
  }

  /** Register a listener that will be removed after its first invocation */
  public once(event: string, callback: Listener<T>): void {
    const onceWrapper = ((data: T) => {
      callback(data);
      onceWrapper.once = true; // Mark for removal
    }) as Listener<T>;
    this.on(event, onceWrapper);
  }
}

/**
 * Handle Telegram bot events
 * TODO: We need also a way to unsubscribe all callout response related event listeners when a user stops a callout response and for other cases.
 */
@Singleton()
export class EventService extends EventDispatcher {
  constructor() {
    super();
    console.debug(`${this.constructor.name} created`);
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
    const emittedEvents: { res: void; eventName: string }[] = [];
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
  public emit<T = Context>(eventName: string, detail: T) {
    return this.dispatch(eventName, detail);
  }

  /**
   * Listen for a Telegram bot event
   * @param eventName The event name to listen for, e.g. "message"
   * @param callback The callback function to call when the event is emitted
   */
  public on<T = Context>(
    eventName: string,
    callback: EventTelegramBotListener<T>,
  ) {
    return super.on(eventName, callback);
  }

  /**
   * Listen for a Telegram bot event, but only once
   * @param eventName
   * @param callback The callback function to call when the event is emitted
   * @returns
   */
  public once<T = Context>(
    eventName: string,
    callback: EventTelegramBotListener<T>,
  ) {
    return super.once(eventName, callback);
  }

  /**
   * Returns a promise that resolves when the given event is emitted
   * @param eventName
   * @returns
   */
  public onceAsync<T = Context>(
    eventName: string,
  ): Promise<EventTelegramBot<T>> {
    return new Promise((resolve) => {
      this.on(eventName, (event) => {
        resolve(event as EventTelegramBot<T>);
      });
    });
  }

  /**
   * Stop listening for a Telegram bot event
   * @param eventName
   * @param callback The callback function to call when the event is emitted
   */
  public off<T = Context>(
    eventName: string,
    callback: EventTelegramBotListener<T>,
  ) {
    return super.off(
      eventName,
      callback,
    );
  }

  /**
   * Listen for a Telegram user message
   * @param id The Telegram user id
   * @param callback The callback function to call when the event is emitted
   */
  public onUserMessage(id: number, callback: EventTelegramBotListener) {
    return this.on("message:user-" + id, callback);
  }

  /**
   * Listen for a Telegram user message, but only once
   * @param id The Telegram user id
   * @param callback The callback function to call when the event is emitted
   */
  public onceUserMessage(id: number, callback: EventTelegramBotListener) {
    return this.once("message:user-" + id, callback);
  }

  /**
   * Returns a promise that resolves when the given user message is emitted
   * @param id The Telegram user id
   * @returns
   */
  public async onceUserMessageAsync(id: number): Promise<EventTelegramBot> {
    return await this.onceAsync("message:user-" + id) as EventTelegramBot;
  }

  /**
   * Stop listening for a Telegram user message
   * @param id The Telegram user id
   * @param callback The callback function to call when the event is emitted
   */
  public offUserMessage(id: number, callback: EventTelegramBotListener) {
    return this.off("message:user-" + id, callback);
  }
}

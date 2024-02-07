import type { Context } from "grammy/mod.ts";
import type { EventTelegramBot } from "./index.ts";

export interface EventTelegramBotListener<T = Context> {
  (evt: EventTelegramBot<T>): void | Promise<void>;
}

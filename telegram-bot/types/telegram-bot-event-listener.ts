import type { Context } from "grammy/mod.ts";
import type { TelegramBotEvent } from "./index.ts";

export interface TelegramBotEventListener<T = Context> {
  (evt: TelegramBotEvent<T>): void | Promise<void>;
}

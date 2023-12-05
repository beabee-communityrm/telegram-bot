import type { Context } from "grammy/mod.ts";

export type TelegramBotEvent<T = Context> = CustomEvent<T>;

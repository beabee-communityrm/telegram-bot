import type { Context } from "grammy/mod.ts";

export type EventTelegramBot<T = Context> = CustomEvent<T>;

import type { AppContext, EventTelegramBot } from "./index.ts";

export interface EventTelegramBotListener<T = AppContext> {
  (evt: EventTelegramBot<T>): void | Promise<void>;
}

import type { RenderResultType } from "../enums/index.ts";
import type { InlineKeyboard, Keyboard } from "grammy/mod.ts";

export interface RenderResultBase {
  type: RenderResultType;
  keyboard?: InlineKeyboard | Keyboard;
}

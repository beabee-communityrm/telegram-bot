import type { RenderResultType } from "../enums/index.ts";
import type { InlineKeyboard, Keyboard, ReplayWaitFor } from "./index.ts";
export interface RenderResultBase {
  type: RenderResultType;
  keyboard?: InlineKeyboard | Keyboard;
  /**
   * If you want to wait for a replay, you can define it here
   */
  waitFor?: ReplayWaitFor;
}

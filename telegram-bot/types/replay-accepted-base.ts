import type { ReplayType } from "../enums/index.ts";
import type { Context } from "./index.ts";

export interface ReplayAcceptedBase {
  /** The type of the replay. */
  type: ReplayType;
  /** True if the message was accepted, false if not. */
  accepted: boolean;
  /** True if the question is answered, false if not. */
  isDone: boolean;
  /** The original replay Telegram context */
  context: Context;
}

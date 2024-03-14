import type { ReplayType } from "../enums/index.ts";
import type { Context } from "../deps/index.ts";

export interface ReplayAcceptedBase {
  /** The type of the replay. */
  type: ReplayType;
  /** True if the replay was accepted, false if not. */
  accepted: boolean;
  /** True if the replay is done and nor more replays are needed, false if not. */
  isDone: boolean;
  /** The original replay Telegram context */
  context: Context;
}

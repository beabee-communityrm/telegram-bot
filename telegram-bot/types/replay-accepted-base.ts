import type { ReplayType } from "../enums/index.ts";
import type { AppContext } from "./index.ts";

export interface ReplayAcceptedBase {
  /** The type of the replay. */
  type: ReplayType;
  /** True if the replay was accepted, false if not. */
  accepted: boolean;
  /** True if the replay is done and nor more replays are needed, false if not. */
  isDoneMessage: boolean;
  /** True if the replay is skipped and nor more replays are needed, false if not. */
  isSkipMessage: boolean;
  /** The original replay Telegram context */
  context: AppContext;
}

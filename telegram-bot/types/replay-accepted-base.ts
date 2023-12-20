import type { ReplayType } from "../enums/index.ts";

export interface ReplayAcceptedBase {
  /** The type of the replay. */
  type: ReplayType;
  /** True if the message was accepted, false if not. */
  accepted: boolean;
  /** True if the question is answered, false if not. */
  isDone: boolean;
}

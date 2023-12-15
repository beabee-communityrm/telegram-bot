import type { ReplayType } from "../enums/index.ts";

export interface ReplayConditionBase {
  /**
   * Define the type you are waiting for to mark the question as answered or to accept the answer.
   */
  type: ReplayType;
}

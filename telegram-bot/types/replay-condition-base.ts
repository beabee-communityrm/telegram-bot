import type { ReplayType } from "../enums/index.ts";

export interface ReplayConditionBase {
  /**
   * Define the type you are waiting for to mark the question as answered or to accept the answer.
   */
  type: ReplayType;

  /**
   * If you want to wait for a special replay, you can set this to `true`.
   * Or in other words: Set this to `true` if multiple answers are allowed
   */
  multiple: boolean;
}

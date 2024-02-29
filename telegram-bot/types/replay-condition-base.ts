import type { ReplayType } from "../enums/index.ts";

/**
 * Define the type of replay you are waiting for.
 * If multiple answers are allowed, you need to set the `doneTexts` property.
 */
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

  /**
   * Define this to wait for a done text message.
   * The property `multiple` must be `true` to use this.
   * If you do not wait for a done text message, leave this empty.
   */
  doneTexts: string[];
}

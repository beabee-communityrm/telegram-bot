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
   * Set this to `true` if multiple answers are allowed
   */
  multiple: boolean;

  /**
   * Set this to `true` if an answer is required and not skippable
   */
  required: boolean;

  /**
   * Define this to wait for a done text message.
   * The property `multiple` must be `true` for this.
   * If you do not wait for a done text messages, leave this empty.
   */
  doneTexts: string[];

  /**
   * Define this to wait for a skip text message.
   * The property `required` must be `false` for this.
   * If you do not wait for a skip text messages, leave this empty.
   */
  skipTexts: string[];
}

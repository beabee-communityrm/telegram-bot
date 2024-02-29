import { ReplayConditionBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

/**
 * Accept or wait for text message.
 * Optionally, you can wait for a specific text messages.
 * @example
 * ```ts
 * const condition: ReplayConditionText = {
 *   type: ReplayType.TEXT,
 *   multiple: true,
 *   texts: ["A", "B"], // "A" and "B" are possible accepted answers
 *   doneText: ["Done"], // If multiple answers are accepted, wait for "Done" message.
 * };
 * ```
 */
export interface ReplayConditionText extends ReplayConditionBase {
  /** Accept or wait for text message */
  type: ReplayType.TEXT;
  /**
   * Define this to wait for a specific message or leave it undefined to wait for any message.
   * - Currently used for "yes" or "no" questions.
   */
  texts?: string[];
}

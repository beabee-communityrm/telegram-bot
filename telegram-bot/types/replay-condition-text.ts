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
   * - If you define multiple possible messages, the logic will wait for the first message that matches.
   * - Leave this undefined or empty to wait for only the first message.
   */
  texts?: string[];
}

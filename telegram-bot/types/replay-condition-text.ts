import { ReplayConditionBase } from "./index.ts";

export interface ReplayConditionText extends ReplayConditionBase {
  type: "message"; // TODO: Rename to "text"
  /**
   * Define this to wait for a specific message or leave it undefined to wait for any message.
   * - If you define multiple possible messages, the logic will wait for the first message that matches.
   * - Leave this undefined to wait for only the first message.
   */
  messages?: string[]; // TODO: Rename to "texts"
}

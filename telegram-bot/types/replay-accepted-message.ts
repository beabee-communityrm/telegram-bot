import { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedMessage extends ReplayAcceptedBase {
  type: "message";
  /**
   * Define this to wait for a specific message or leave it undefined to wait for any message.
   * - If you define multiple possible messages, the logic will wait for the first message that matches.
   * - Leave this undefined to wait for only the first message.
   */
  messages?: string[];
}

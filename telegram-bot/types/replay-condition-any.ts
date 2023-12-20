import type { ReplayConditionBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayConditionAny extends ReplayConditionBase {
  /** Accept or wait for any message */
  type: ReplayType.ANY;
  /**
   * Define a file mime type to wait this specific mime type or leave it undefined to wait for any file type.
   * - Leave this undefined to wait for only the first file.
   */
  mimeTypes?: string[];
  /**
   * Define this to wait for a specific message or leave it undefined to wait for any message.
   * - If you define multiple possible messages, the logic will wait for the first message that matches.
   * - Leave this undefined to wait for only the first message.
   */
  texts?: string[];
}

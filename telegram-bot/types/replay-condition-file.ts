import type { ReplayConditionBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayConditionFile extends ReplayConditionBase {
  /** Accept or wait for file message */
  type: ReplayType.FILE;
  /**
   * Define a file mime type to wait this specific mime type or leave it undefined to wait for any file type.
   * - Leave this undefined to wait for only the first file.
   */
  mimeTypes: string[];
}

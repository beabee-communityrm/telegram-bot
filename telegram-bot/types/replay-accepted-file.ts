import { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedFile extends ReplayAcceptedBase {
  type: "file";
  /**
   * Define a file mime type to wait this specific mime type or leave it undefined to wait for any file type.
   * - Leave this undefined to wait for only the first file.
   */
  mimeTypes?: string[];
}

import type { RelayAcceptedFileType, ReplayType } from "../enums/index.ts";
import type { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedFile extends ReplayAcceptedBase {
  type: ReplayType.FILE;
  fileType?: RelayAcceptedFileType;
  /** The accepted telegram file id */
  fileId?: string;
}

import type { RelayAcceptedFileType, ReplayType } from "../enums/index.ts";
import type { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedFile extends ReplayAcceptedBase {
  type: ReplayType.FILE;
  /** True if file was accepted, false if not. */
  accepted: boolean;
  fileType?: RelayAcceptedFileType;
  /** The accepted telegram file id */
  fileId?: string;
}

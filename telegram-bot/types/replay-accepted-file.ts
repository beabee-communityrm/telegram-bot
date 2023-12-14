import type { RelayAcceptedFileType } from "../enums/index.ts";
import type { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedFile extends ReplayAcceptedBase {
  type: "file";
  fileType?: RelayAcceptedFileType;
}

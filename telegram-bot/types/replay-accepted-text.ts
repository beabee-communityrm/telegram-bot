import type { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayAcceptedText extends ReplayAcceptedBase {
  type: ReplayType.TEXT;
  accepted: boolean;
  /** The accepted text */
  text?: string;
}

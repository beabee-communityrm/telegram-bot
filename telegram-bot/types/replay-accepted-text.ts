import type { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayAcceptedText extends ReplayAcceptedBase {
  type: ReplayType.TEXT;
  accepted: boolean;
  /** The text message that was accepted or undefined if the replay was not accepted */
  text?: string;
}

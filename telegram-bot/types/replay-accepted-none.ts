import type { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

/**
 * No replay accepted
 */
export interface ReplayAcceptedNone extends ReplayAcceptedBase {
  type: ReplayType.NONE;
  accepted: false;
}

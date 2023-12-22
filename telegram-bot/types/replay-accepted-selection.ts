import type { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

/**
 * Used for `select`, `radio` and `selectboxes` types
 */
export interface ReplayAcceptedSelection extends ReplayAcceptedBase {
  type: ReplayType.SELECTION;
  accepted: boolean;
  /** The selected option value */
  value?: string;
}

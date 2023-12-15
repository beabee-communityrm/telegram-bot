import type { ReplayConditionBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayConditionAny extends ReplayConditionBase {
  /** Accept or wait for any message */
  type: ReplayType.ANY;
}

import { ReplayConditionBase } from "./index.ts";

export interface ReplayConditionAny extends ReplayConditionBase {
  /** Accept or wait for any message */
  type: "any";
}

import type { ReplayConditionBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

/**
 * Select one of one or more options
 */
export interface ReplayConditionSelection extends ReplayConditionBase {
  /** Accept or wait for file message */
  type: ReplayType.SELECTION;
  /** Define the options the user can select */
  valueLabel: Record<string, string>;
}

import type { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayAcceptedAny extends ReplayAcceptedBase {
  type: ReplayType.ANY;
  accepted: true;
}

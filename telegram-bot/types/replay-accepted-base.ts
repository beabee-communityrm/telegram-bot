import type { ReplayType } from "../enums/index.ts";

export interface ReplayAcceptedBase {
  type: ReplayType;
  accepted: boolean;
}

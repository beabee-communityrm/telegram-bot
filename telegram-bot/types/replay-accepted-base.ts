import type { ReplayType } from "./index.ts";

export interface ReplayAcceptedBase {
  type: ReplayType;
  accepted: boolean;
}

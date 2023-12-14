import type { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedAny extends ReplayAcceptedBase {
  type: "any";
  accepted: true;
}

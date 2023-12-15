import type { ReplayAcceptedBase } from "./index.ts";

export interface ReplayAcceptedText extends ReplayAcceptedBase {
  type: "text";
  accepted: boolean;
}

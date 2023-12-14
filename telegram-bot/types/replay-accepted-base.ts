import { ReplayType } from "./index.ts";

export interface ReplayAcceptedBase {
  /**
   * Define the type of the replay you are waiting for to mark the question as answered.
   */
  type: ReplayType;
}

import { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";

export interface ReplayAcceptedCallbackQueryData extends ReplayAcceptedBase {
  /** Accept or wait for text message */
  type: ReplayType.CALLBACK_QUERY_DATA;
  /** Callback query data to accept */
  data: string;
}

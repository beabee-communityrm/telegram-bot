import type { ReplayAcceptedBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";
import type { CalloutResponseAnswer } from "../deps/index.ts";

export interface ReplayAcceptedCalloutComponentSchema
  extends ReplayAcceptedBase {
  type: ReplayType.CALLOUT_COMPONENT_SCHEMA;
  accepted: boolean;
  /** The accepted callout answer */
  answer?: CalloutResponseAnswer;
}

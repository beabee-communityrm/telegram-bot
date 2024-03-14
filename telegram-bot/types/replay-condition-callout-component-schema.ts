import { ReplayConditionBase } from "./index.ts";
import type { ReplayType } from "../enums/index.ts";
import type { CalloutComponentSchema } from "../deps/index.ts";

/**
 * Accept or wait for a callout answer replay.
 */
export interface ReplayConditionCalloutComponentSchema
  extends ReplayConditionBase {
  /** Accept or wait for callout answer replay */
  type: ReplayType.CALLOUT_COMPONENT_SCHEMA;
  /** The callout component schema to validate the callout answer */
  schema: CalloutComponentSchema;
}

import {
  ReplayConditionAny,
  ReplayConditionCalloutComponentSchema,
  ReplayConditionFile,
  ReplayConditionNone,
  ReplayConditionSelection,
  ReplayConditionText,
} from "./index.ts";

/**
 * Type to define a replay type you accept or you are waiting for. E.g. a message or a file
 */
export type ReplayCondition =
  | ReplayConditionText
  | ReplayConditionFile
  | ReplayConditionSelection
  | ReplayConditionAny
  | ReplayConditionNone
  | ReplayConditionCalloutComponentSchema;

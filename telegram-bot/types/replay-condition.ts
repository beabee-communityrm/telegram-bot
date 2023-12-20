import {
  ReplayConditionAny,
  ReplayConditionFile,
  ReplayConditionNone,
  ReplayConditionText,
} from "./index.ts";

/**
 * Type to define a replay type you accept or you are waiting for. E.g. a message or a file
 */
export type ReplayCondition =
  | ReplayConditionText
  | ReplayConditionFile
  | ReplayConditionAny
  | ReplayConditionNone;

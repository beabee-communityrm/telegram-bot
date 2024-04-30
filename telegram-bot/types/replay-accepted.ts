import type {
  ReplayAcceptedAny,
  ReplayAcceptedCallbackQueryData,
  ReplayAcceptedCalloutComponentSchema,
  ReplayAcceptedFile,
  ReplayAcceptedNone,
  ReplayAcceptedSelection,
  ReplayAcceptedText,
} from "./index.ts";

export type ReplayAccepted =
  | ReplayAcceptedFile
  | ReplayAcceptedText
  | ReplayAcceptedAny
  | ReplayAcceptedNone
  | ReplayAcceptedSelection
  | ReplayAcceptedCalloutComponentSchema
  | ReplayAcceptedCallbackQueryData;

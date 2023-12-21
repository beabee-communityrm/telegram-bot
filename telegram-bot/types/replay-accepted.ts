import type {
  ReplayAcceptedAny,
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
  | ReplayAcceptedSelection;

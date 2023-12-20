import type {
  ReplayAcceptedAny,
  ReplayAcceptedFile,
  ReplayAcceptedNone,
  ReplayAcceptedText,
} from "./index.ts";

export type ReplayAccepted =
  | ReplayAcceptedFile
  | ReplayAcceptedText
  | ReplayAcceptedAny
  | ReplayAcceptedNone;

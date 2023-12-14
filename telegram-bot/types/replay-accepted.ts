import type {
  ReplayAcceptedAny,
  ReplayAcceptedFile,
  ReplayAcceptedText,
} from "./index.ts";

export type ReplayAccepted =
  | ReplayAcceptedFile
  | ReplayAcceptedText
  | ReplayAcceptedAny;

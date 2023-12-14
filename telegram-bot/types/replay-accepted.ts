import { ReplayAcceptedFile, ReplayAcceptedMessage } from "./index.ts";

/**
 * Type to define a replay type you are waiting for. E.g. a message or a file
 */
export type ReplayAccepted = ReplayAcceptedMessage | ReplayAcceptedFile;

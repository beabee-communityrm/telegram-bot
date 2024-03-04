import type { Context } from "../deps.ts";

/**
 * Type to collect replies. A reply can be a message or a file.
 * A reply can also be a collection of replies if the user can give several answers to Callout.
 * @deprecated Use `Response` instead.
 */
export type Replay = Array<Context | Replay>;

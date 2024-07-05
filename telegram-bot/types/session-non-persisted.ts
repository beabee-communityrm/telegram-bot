import type { AppContext } from "./index.ts";
// import type { InlineKeyboard, Keyboard } from "../deps/index.ts";

/**
 * SessionNonPersisted is used for data for a chat session but not persisted.
 * We use this for objects that cannot be persisted
 */
export interface SessionNonPersisted {
  /** Reverse reference to the context */
  ctx: AppContext | null;
  /** Used to cancel any current task completely */
  abortController: AbortController | null;
}

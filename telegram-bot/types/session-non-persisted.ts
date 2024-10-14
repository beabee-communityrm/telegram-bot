/**
 * SessionNonPersisted is used for data for a chat session but not persisted.
 * We use this for objects that cannot be persisted
 */
export interface SessionNonPersisted {
  /** Used to cancel any current task completely */
  abortController: AbortController | null;
}

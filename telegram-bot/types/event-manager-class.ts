import type { BaseEventManager } from "../core/base.events.ts";

/**
 * A command class is a class that implements the Command interface.
 */
// deno-lint-ignore no-explicit-any
export type EventManagerClass = (new (...args: any[]) => BaseEventManager) & {
  getSingleton: () => BaseEventManager;
};

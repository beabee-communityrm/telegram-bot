import type { EventManager } from "../core/event-manager.ts";

/**
 * A command class is a class that implements the Command interface.
 */
// deno-lint-ignore no-explicit-any
export type EventManagerClass = new (...args: any[]) => EventManager;

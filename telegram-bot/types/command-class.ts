import type { Command } from "./index.ts";

/**
 * A command class is a class that implements the Command interface.
 */
export type CommandClass = new (...args: any[]) => Command;

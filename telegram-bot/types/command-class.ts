import type { BaseCommand } from "../core/base.command.ts";

/**
 * A command class is a class that implements the Command interface.
 */
// deno-lint-ignore no-explicit-any
export type CommandClass =
  & { getSingleton(): BaseCommand }
  & (new (...args: any[]) => BaseCommand);

import type { BaseCommand } from "../core/base.command.ts";

/**
 * A command class is a class that implements the Command interface.
 */
export type CommandClass =
  & { getSingleton(): BaseCommand }
  // deno-lint-ignore no-explicit-any
  & (new (...args: any[]) => BaseCommand);

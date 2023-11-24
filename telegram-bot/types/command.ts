import type { Context } from "grammy/context.ts";

export interface Command {
    command: string;
    description: string;

    action(ctx: Context): Promise<void>;
}
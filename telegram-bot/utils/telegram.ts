import type { Context } from "../types/index.ts";

export const getIdentifier = (ctx: Context) => {
  const id = ctx.chat?.id || ctx.from?.id;
  if (!id) {
    throw new Error("No id found on context");
  }
  return id;
};

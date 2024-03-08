import type { Context, ParseModeFlavor, SessionFlavor } from "../deps.ts";
import type { SessionState } from "./index.ts";

/**
 * Extended Grammy {@link Context} for plugins and custom data used in this bot
 */
export type AppContext =
  & Context
  & ParseModeFlavor<Context>
  & SessionFlavor<SessionState>;

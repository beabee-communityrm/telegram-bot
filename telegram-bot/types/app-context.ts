import type { Context, ParseModeFlavor, SessionFlavor } from "../deps.ts";
import type { SessionState } from "./index.ts";

export type AppContext =
  & Context
  & ParseModeFlavor<Context>
  & SessionFlavor<SessionState>;

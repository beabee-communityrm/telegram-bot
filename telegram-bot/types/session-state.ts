import type { ChatState } from "../enums/index.ts";
import type { AppContext } from "./index.ts";

export interface SessionState {
  state: ChatState;

  /** Additional untracked data, this data should not be stored in a database */
  _data: {
    /** Reverse reference to the context */
    ctx: AppContext | null;
  };
}

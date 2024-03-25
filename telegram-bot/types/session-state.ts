import type { ChatState } from "../enums/index.ts";
import type { AppContext } from "./index.ts";
import type { InlineKeyboard } from "../deps/index.ts";

export interface SessionState {
  state: ChatState;

  /** Additional untracked data, this data should not be stored in a database */
  _data: {
    /** Reverse reference to the context */
    ctx: AppContext | null;
    /** Used to cancel any current task */
    abortController: AbortController | null;
    /** The latest inline keyboard that was sent to the user */
    latestKeyboard: {
      message_id: number;
      chat_id: number;
      inlineKeyboard: InlineKeyboard;
      /**
       * Type of the keyboard, currently unused.
       * inline - InlineKeyboard
       */
      type: "inline";
    } | null;
  };
}

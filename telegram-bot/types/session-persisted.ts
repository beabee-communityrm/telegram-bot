import type { AbortControllerState, ChatState } from "../enums/index.ts";

/**
 * SessionPersisted is used for data of a chat session handled by Grammy's session plugin and
 * is stored in the database to make them persistent.
 */
export interface SessionPersisted {
  state: ChatState;
  /** The latest inline keyboard that was sent to the user */
  latestKeyboard: {
    message_id: number;
    chat_id: number;
    /** The number of buttons in the keyboard */
    buttonCount: number;
    /**
     * Type of the keyboard, currently unused.
     * inline - InlineKeyboard
     */
    type: "inline" | "custom";
  } | null;

  /**
   * The state of the abort controller.
   * Used to restore the abort controller state when the session is restored.
   */
  abortControllerState: AbortControllerState;
}

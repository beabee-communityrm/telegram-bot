import type { RenderResultType } from "../enums/index.ts";
import type { InlineKeyboard, Keyboard, ReplayCondition } from "./index.ts";

export interface RenderResultBase {
  /**
   * Define the type of the render result, e.g. a message or a file.
   * This can be a for example message or image sent to the user.
   */
  type: RenderResultType;
  /**
   * Define this to show a keyboard to the user
   */
  keyboard?: InlineKeyboard | Keyboard;
  /**
   * If you want to wait for a special replay, you can define it here.
   * - As soon as the user sends the replay of this type, the logic will mark the question as answered.
   * - Leave this undefined to not wait for a replay.
   */
  acceptedUntil?: ReplayCondition;

  /**
   * Define the types of the replay you are accepting until the logic marks the question as answered.
   *
   * TODO: This is unused at the moment but we should use something like that to implement validation.
   */
  acceptedBefore?: ReplayCondition;
}

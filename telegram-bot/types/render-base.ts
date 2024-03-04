import type { ParsedResponseType, RenderType } from "../enums/index.ts";
import type { ReplayCondition } from "./index.ts";
import type { InlineKeyboard, Keyboard } from "../deps.ts";

export interface RenderBase {
  /**
   * Define a unique key for this render result.
   * You can use this to:
   * - identify the render result in the logic.
   * - update the render result later on.
   * - assign a answer to a question.
   */
  key: string;

  /**
   * Define the type of the render result, e.g. a message or a file.
   * This can be a for example message or image sent to the user.
   */
  type: RenderType;

  /**
   * Define this to show a keyboard to the user
   */
  keyboard?: InlineKeyboard | Keyboard;

  /**
   * Define the types of the replay you are accepting.
   */
  accepted: ReplayCondition;

  /**
   * The type in which the response should be parsed.
   */
  parseType: ParsedResponseType;
}

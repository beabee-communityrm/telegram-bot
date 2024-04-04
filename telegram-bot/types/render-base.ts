import type { ParsedResponseType, RenderType } from "../enums/index.ts";
import type { ReplayCondition } from "./index.ts";
import type {
  InlineKeyboard,
  Keyboard,
  LinkPreviewOptions,
} from "../deps/index.ts";

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
   * Define this to show a custom keyboard to the user
   */
  keyboard?: Keyboard;

  /**
   * Define this to show a inline keyboard to the user
   */
  inlineKeyboard?: InlineKeyboard;

  /**
   * Remove the custom keyboard after the user has replied.
   */
  removeKeyboard: boolean;

  /**
   * Define the types of the replay you are accepting.
   */
  accepted: ReplayCondition;

  /**
   * The type in which the response should be parsed.
   */
  parseType: ParsedResponseType;

  /**
   * The delay in milliseconds before the message is sent.
   */
  beforeDelay?: number;

  /**
   * The delay in milliseconds after the message is sent.
   */
  afterDelay?: number;

  linkPreview?: LinkPreviewOptions;
}

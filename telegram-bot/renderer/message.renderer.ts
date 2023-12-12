import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";

import type { RenderResult, RenderResultText } from "../types/index.ts";

/**
 * Render info messages for Telegram in Markdown
 */
@Singleton()
export class MessageRenderer {
  constructor() {
    console.debug(`${MessageRenderer.name} created`);
  }

  public stop() {
    const result: RenderResult = {
      type: RenderResultType.TEXT,
      text: "Ok, no problem",
    };

    return result;
  }

  public calloutNotFound() {
    const result: RenderResult = {
      type: RenderResultType.TEXT,
      text: "Callout not found",
    };

    return result;
  }

  public notATextMessage() {
    return {
      type: RenderResultType.TEXT,
      text: "Please send a text message",
    } as RenderResultText;
  }

  public notAFileMessage() {
    return {
      type: RenderResultType.TEXT,
      text: "Please send a file",
    } as RenderResultText;
  }
}

import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { KeyboardService } from "../services/index.ts";

import type { RenderResult } from "../types/index.ts";

/**
 * Render info messages for Telegram in Markdown
 */
@Singleton()
export class MessageRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
  ) {}

  public stop() {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: "Ok, no problem",
    };

    return result;
  }

  public calloutNotFound() {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: "Callout not found",
    };

    return result;
  }
}

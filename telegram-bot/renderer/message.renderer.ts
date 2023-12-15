import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { getSimpleMimeTypes } from "../utils/index.ts";

import type {
  RenderResult,
  RenderResultText,
  ReplayAccepted,
} from "../types/index.ts";

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

  public notTheRightFileType(mimeTypes: string[]) {
    // TODO: Translate `or`
    const mimeTypesStr = getSimpleMimeTypes(mimeTypes).join(", ").replace(
      /, ([^,]*)$/,
      " or $1",
    );
    return {
      type: RenderResultType.TEXT,
      text: "Please send a file of type " + mimeTypesStr,
    } as RenderResultText;
  }

  public notAcceptedMessage(accepted: ReplayAccepted, mimeTypes?: string[]) {
    if (accepted.accepted) {
      throw new Error("This message was accepted");
    }
    if (accepted.type === "text") {
      return this.notATextMessage();
    }
    if (accepted.type === "file") {
      if (mimeTypes?.length) {
        return this.notTheRightFileType(mimeTypes);
      }
      return this.notAFileMessage();
    }
    throw new Error("Unknown accepted type");
  }

  public writeDoneMessage(doneText: string) {
    return {
      type: RenderResultType.TEXT,
      text: `If you are finished with your response, write "${doneText}".`,
    } as RenderResultText;
  }
}

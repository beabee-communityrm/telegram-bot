import { Singleton } from "alosaur/mod.ts";
import { RenderType } from "../enums/index.ts";
import { getSimpleMimeTypes } from "../utils/index.ts";

import type { Render, RenderText, ReplayAccepted } from "../types/index.ts";

/**
 * Render info messages for Telegram in Markdown
 */
@Singleton()
export class MessageRenderer {
  constructor() {
    console.debug(`${MessageRenderer.name} created`);
  }

  public stop() {
    const result: Render = {
      type: RenderType.TEXT,
      text: "Ok, no problem",
    };

    return result;
  }

  public calloutNotFound() {
    const result: Render = {
      type: RenderType.TEXT,
      text: "Callout not found",
    };

    return result;
  }

  public notATextMessage() {
    return {
      type: RenderType.TEXT,
      text: "Please send a text message",
    } as RenderText;
  }

  public notAFileMessage() {
    return {
      type: RenderType.TEXT,
      text: "Please send a file",
    } as RenderText;
  }

  public notTheRightFileType(mimeTypes: string[]) {
    // TODO: Translate `or`
    const mimeTypesStr = getSimpleMimeTypes(mimeTypes).join(", ").replace(
      /, ([^,]*)$/,
      " or $1",
    );
    return {
      type: RenderType.TEXT,
      text: "Please send a file of type " + mimeTypesStr,
    } as RenderText;
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
      type: RenderType.TEXT,
      text: `If you are finished with your response, write "${doneText}".`,
    } as RenderText;
  }
}

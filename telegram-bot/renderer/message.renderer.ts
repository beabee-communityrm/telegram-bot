import { Singleton } from "alosaur/mod.ts";
import { RenderType } from "../enums/index.ts";
import { getSimpleMimeTypes } from "../utils/index.ts";

import type {
  Render,
  RenderText,
  ReplayAccepted,
  ReplayCondition,
} from "../types/index.ts";
import { ReplayType } from "../enums/replay-type.ts";
import { ParsedResponseType } from "../enums/parsed-response-type.ts";

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
      key: "stop",
      accepted: {
        type: ReplayType.NONE,
      },
      multiple: false,
      parseType: ParsedResponseType.NONE,
    };

    return result;
  }

  public calloutNotFound() {
    const result: Render = {
      type: RenderType.TEXT,
      text: "Callout not found",
      key: "callout-not-found",
      accepted: {
        type: ReplayType.NONE,
      },
      multiple: false,
      parseType: ParsedResponseType.NONE,
    };

    return result;
  }

  public notATextMessage(): RenderText {
    return {
      type: RenderType.TEXT,
      text: "Please send a text message",
      key: "not-a-text-message",
      accepted: {
        type: ReplayType.NONE,
      },
      multiple: false,
      parseType: ParsedResponseType.NONE,
    };
  }

  public notAFileMessage(): RenderText {
    return {
      type: RenderType.TEXT,
      text: "Please send a file",
      key: "not-a-file-message",
      accepted: {
        type: ReplayType.NONE,
      },
      multiple: false,
      parseType: ParsedResponseType.NONE,
    };
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

  public notAcceptedMessage(
    accepted: ReplayAccepted,
    condition: ReplayCondition,
  ) {
    if (accepted.accepted) {
      throw new Error("This message was accepted");
    }
    if (condition.type === ReplayType.TEXT) {
      return this.notATextMessage();
    }

    if (condition.type === ReplayType.FILE) {
      if (condition.mimeTypes?.length) {
        return this.notTheRightFileType(condition.mimeTypes);
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

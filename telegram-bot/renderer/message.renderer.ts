import { Singleton } from "../deps.ts";
import { RenderType } from "../enums/index.ts";
import { getSimpleMimeTypes } from "../utils/index.ts";
import { ConditionService } from "../services/condition.service.ts";
import { I18nService } from "../services/i18n.service.ts";

import type {
  Render,
  RenderText,
  ReplayAccepted,
  ReplayCondition,
} from "../types/index.ts";
import type { CalloutComponentSchema } from "../deps.ts";
import { ReplayType } from "../enums/replay-type.ts";
import { ParsedResponseType } from "../enums/parsed-response-type.ts";

/**
 * Render info messages for Telegram in Markdown
 */
@Singleton()
export class MessageRenderer {
  constructor(
    protected readonly condition: ConditionService,
    protected readonly i18n: I18nService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  public stop() {
    const tKey = "bot.response.messages.stop";
    const result: Render = {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    return result;
  }

  public calloutNotFound() {
    const tKey = "bot.response.messages.calloutNotFound";
    const result: Render = {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    return result;
  }

  public notATextMessage(texts: string[] = []): RenderText {
    const tKey = texts.length
      ? "bot.response.messages.notATextMessageWithAllowed"
      : "bot.response.messages.notATextMessage";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, { allowed: texts.join(", ") }),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
  }

  public notASelectionMessage(): RenderText {
    const tKey = "bot.response.messages.notASelectionMessage";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
  }

  public notAFileMessage(): RenderText {
    const tKey = "bot.response.messages.notAFileMessage";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
  }

  public notTheRightFileType(mimeTypes: string[]) {
    const mimeTypesStr = getSimpleMimeTypes(mimeTypes).join(", ").replace(
      /, ([^,]*)$/,
      ` ${this.i18n.t("bot.universal.or")} $1`,
    );
    return {
      type: RenderType.TEXT,
      text: this.i18n.t("bot.response.messages.notTheRightFileType", {
        type: mimeTypesStr,
      }),
    } as RenderText;
  }

  public notACalloutComponentMessage(schema: CalloutComponentSchema) {
    const tKey = `bot.response.messages.notACalloutComponent.${schema.type}`;
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, { type: schema.type }),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    } as RenderText;
  }

  public notAcceptedMessage(
    accepted: ReplayAccepted,
    condition: ReplayCondition,
  ) {
    if (accepted.accepted) {
      throw new Error("This message was accepted but should not be");
    }

    if (condition.type === ReplayType.TEXT) {
      return this.notATextMessage(condition.texts);
    }

    if (condition.type === ReplayType.SELECTION) {
      return this.notASelectionMessage();
    }

    if (condition.type === ReplayType.FILE) {
      if (condition.mimeTypes?.length) {
        return this.notTheRightFileType(condition.mimeTypes);
      }
      return this.notAFileMessage();
    }

    if (condition.type === ReplayType.CALLOUT_COMPONENT_SCHEMA) {
      return this.notACalloutComponentMessage(condition.schema);
    }

    throw new Error("Unknown accepted type: " + condition.type);
  }

  public writeDoneMessage(doneText: string) {
    return {
      type: RenderType.TEXT,
      text: this.i18n.t("bot.info.messages.done", { done: doneText }),
    } as RenderText;
  }
}

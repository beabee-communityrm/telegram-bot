import { Singleton } from "../deps.ts";
import { RenderType } from "../enums/index.ts";
import { getSimpleMimeTypes } from "../utils/index.ts";
import { ConditionService } from "../services/condition.service.ts";
import { I18nService } from "../services/i18n.service.ts";

import type {
  Render,
  RenderMarkdown,
  RenderText,
  ReplayAccepted,
  ReplayCondition,
  UserState,
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

  /**
   * Render a welcome message
   * @returns
   */
  public welcome(): RenderMarkdown {
    // TODO: This message should be customizable via Beabee's Content API
    const WELCOME_MD = "*Hi\\!* _Welcome_ to [beabee](https://beabee.io/)\\.";

    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      markdown: WELCOME_MD,
      key: "welcome",
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
    return result;
  }

  // /**
  //  * Render all available commands
  //  * @param state The current user state
  //  **/
  // public commands(state: UserState): RenderMarkdown {

  //   const result: RenderMarkdown = {
  //     type: RenderType.MARKDOWN,
  //     markdown: ,
  //     key: 'commands',
  //     accepted: this.condition.replayConditionNone(),
  //     parseType: ParsedResponseType.NONE,
  //   };
  //   return result;
  // }

  /**
   * Render the intro message
   */
  public intro(): RenderMarkdown {
    const tKey = "bot.info.messages.intro";

    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      // TODO: Get the bot name from the beabee content API
      markdown: this.i18n.t(tKey, { botName: "beabee" }),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
    return result;
  }

  public stop(): RenderText {
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

  public calloutNotFound(): RenderText {
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

  public notTheRightFileType(mimeTypes: string[]): RenderText {
    const mimeTypesStr = getSimpleMimeTypes(mimeTypes).join(", ").replace(
      /, ([^,]*)$/,
      ` ${this.i18n.t("bot.universal.or")} $1`,
    );
    const tKey = `bot.response.messages.notTheRightFileType`;
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, {
        type: mimeTypesStr,
      }),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
  }

  public notACalloutComponentMessage(
    schema: CalloutComponentSchema,
  ): RenderText {
    const tKey = `bot.response.messages.notACalloutComponent.${schema.type}`;
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, { type: schema.type }),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    } as RenderText;
  }

  public writeDoneMessage(doneText: string): RenderText {
    const tKey = "bot.info.messages.done";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, { done: doneText }),
      key: tKey,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
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
}

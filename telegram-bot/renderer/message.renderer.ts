import { bold, fmt, FormattedString, italic, Singleton } from "../deps.ts";
import { ChatState, RenderType } from "../enums/index.ts";
import { getSimpleMimeTypes } from "../utils/index.ts";
import { ConditionService } from "../services/condition.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommandService } from "../services/command.service.ts";

import type {
  Render,
  RenderFormat,
  RenderMarkdown,
  RenderText,
  ReplayAccepted,
  ReplayCondition,
} from "../types/index.ts";
import type { CalloutComponentSchema } from "../deps.ts";
import { ReplayType } from "../enums/replay-type.ts";
import { ParsedResponseType } from "../enums/parsed-response-type.ts";
import { AppContext } from "../types/app-context.ts";

/**
 * Render info messages for Telegram in Markdown
 */
@Singleton()
export class MessageRenderer {
  constructor(
    protected readonly command: CommandService,
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

  /**
   * Render all available commands
   * @param state The current user state
   */
  public commands(state: ChatState): RenderFormat {
    const commands = this.command.getForState(state);

    const strings: FormattedString[] = [];

    for (const command of commands) {
      strings.push(
        fmt`${bold("/" + command.command)}: ${italic(command.description)}\n`,
      );
    }

    const result: RenderFormat = {
      type: RenderType.FORMAT,
      format: strings,
      key: "commands",
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    return result;
  }

  public async debug(ctx: AppContext): Promise<RenderFormat> {
    const strings: FormattedString[] = [];
    const session = await ctx.session;

    strings.push(fmt`${bold("State: ")} ${session.state}\n`);
    if (ctx.chat) {
      strings.push(fmt`${bold("Chat ID: ")} ${ctx.chat?.id}\n`);
      strings.push(fmt`${bold("Chat type: ")} ${ctx.chat?.type}\n`);
    }

    // Add more debug info here if needed

    return {
      type: RenderType.FORMAT,
      format: strings,
      key: "debug",
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
  }

  /**
   * Render the intro message
   */
  public intro(state: ChatState): RenderFormat {
    const tKey = "bot.info.messages.intro";

    const commands = fmt((this.commands(state)).format);
    const intro = this.i18n.t(tKey, {
      botName: "beabee",
      commands: commands.toString(),
    });

    const result: RenderFormat = {
      type: RenderType.FORMAT,
      // TODO: Get the bot name from the beabee content API
      format: [intro],
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

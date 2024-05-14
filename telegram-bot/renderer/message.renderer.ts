import { bold, fmt, FormattedString, Singleton } from "../deps/index.ts";
import { ChatState, RenderType } from "../enums/index.ts";
import { escapeMd, getSimpleMimeTypes } from "../utils/index.ts";
import { ConditionService } from "../services/condition.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { BotService } from "../services/bot.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { CommandService } from "../services/command.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";

import type {
  Render,
  RenderFormat,
  RenderMarkdown,
  RenderText,
  ReplayAccepted,
  ReplayCondition,
} from "../types/index.ts";
import { BotCommand, CalloutComponentSchema, code } from "../deps/index.ts";
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
    protected readonly bot: BotService,
    protected readonly keyboard: KeyboardService,
    protected readonly stateMachine: StateMachineService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Render a welcome message
   * @returns
   */
  public welcome(): RenderMarkdown {
    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      markdown: this.stateMachine.settings.telegram.welcomeMessageMd,
      key: "welcome",
      ...this.noResponse(),
    };
    return result;
  }

  /**
   * Render all available commands
   * @param state The current user state
   */
  public commands(state: ChatState): RenderMarkdown {
    const commands = this.command.getForState(state);

    let markdown = "";

    for (const command of commands) {
      markdown += `/${escapeMd(command.command)}: ${
        escapeMd(command.description)
      }\n`;
    }

    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      markdown,
      key: "commands",
      ...this.noResponse(),
    };

    return result;
  }

  /**
   * Render a message that the command is not usable
   * @returns The render object
   */
  public commandNotUsable(command: BotCommand, state: ChatState) {
    const tKey = "bot.info.messages.command.notUsable";
    const result: Render = {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, {
        command: "/" + command.command,
        state,
      }),
      key: tKey,
      ...this.noResponse(),
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
      if (!session._data.abortController) {
        strings.push(fmt`${bold("AbortController: ")} null\n`);
      } else {
        strings.push(
          fmt`${bold("AbortController: ")} ${
            session._data.abortController.signal.aborted
              ? "aborted"
              : "not aborted"
          }\n`,
        );
      }

      // TODO: Make debug message configurable
      strings.push(fmt`${bold("beabee settings:")}\n`);
      const settings = this.stateMachine.settings;
      strings.push(code(JSON.stringify(settings, null, 2)));
    }

    // Add more debug info here if needed

    return {
      type: RenderType.FORMAT,
      format: strings,
      key: "debug",
      ...this.noResponse(),
    };
  }

  protected noResponse() {
    return {
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
      forceReply: false,
    };
  }

  protected getGeneralContentPlaceholdersMarkdown() {
    const general = this.stateMachine.settings.general;
    return {
      botFirstName: this.bot.botInfo.first_name,
      botLastName: this.bot.botInfo.last_name || "Error: last_name not set",
      botUsername: this.bot.botInfo.username,
      organisationName: `[${escapeMd(general.organisationName)}](${
        escapeMd(general.siteUrl)
      })`,
      siteUrl: general.siteUrl,
      supportEmail: general.supportEmail,
      privacyLink: general.privacyLink || "Error: privacyLink not set",
      termsLink: general.termsLink || "Error: termsLink not set",
      impressumLink: general.impressumLink || "Error: impressumLink not set",
    };
  }

  /**
   * Render the help message
   */
  public help(state: ChatState): RenderMarkdown {
    const key = "bot.info.messages.help";
    const generalContentPlaceholders = this
      .getGeneralContentPlaceholdersMarkdown();
    const commands = this.commands(state).markdown;
    const markdown = this.i18n.t(key, {
      ...generalContentPlaceholders,
      commands: commands,
    }, { escapeMd: true });

    console.debug("help markdown:", markdown);

    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      markdown,
      key,
      ...this.noResponse(),
    };
    return result;
  }

  public async continueList(): Promise<RenderMarkdown> {
    const key = "bot.info.messages.continueList";
    const generalContentPlaceholders = await this
      .getGeneralContentPlaceholdersMarkdown();
    const markdown = this.i18n.t(key, {
      ...generalContentPlaceholders,
    }, { escapeMd: true });

    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      markdown,
      key,
      keyboard: this.keyboard.empty(), // To replace the old one
      ...this.noResponse(),
    };
    return result;
  }

  public async continueHelp(state: ChatState): Promise<RenderMarkdown> {
    const tKey = "bot.info.messages.helpContinue";
    const generalContentPlaceholders = await this
      .getGeneralContentPlaceholdersMarkdown();
    const commands = this.commands(state).markdown;
    const intro = this.i18n.t(tKey, {
      ...generalContentPlaceholders,
      commands: commands,
    }, { escapeMd: true });

    const result: RenderMarkdown = {
      type: RenderType.MARKDOWN,
      markdown: intro,
      key: tKey,
      ...this.noResponse(),
    };
    return result;
  }

  public stop(): RenderText {
    const tKey = "bot.response.messages.stop";
    const result: Render = {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
    };

    return result;
  }

  public calloutNotFound(): RenderText {
    const tKey = "bot.response.messages.calloutNotFound";
    const result: Render = {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
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
      ...this.noResponse(),
    };
  }

  public notASelectionMessage(): RenderText {
    const tKey = "bot.response.messages.notASelectionMessage";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
    };
  }

  /**
   * Cancel successful message
   * @returns
   */
  public resetSuccessfulMessage(): RenderText {
    const tKey = "bot.info.messages.reset.successful";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
    };
  }

  /**
   * Cancel unsuccessful message
   * @returns
   */
  public resetUnsuccessfulMessage(): RenderText {
    const tKey = "bot.info.messages.reset.unsuccessful";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
    };
  }

  /**
   * Already cancelled message
   * @returns
   */
  public resetCancelledMessage(): RenderText {
    const tKey = "bot.info.messages.reset.cancelled";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
    };
  }

  public notAFileMessage(): RenderText {
    const tKey = "bot.response.messages.notAFileMessage";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey),
      key: tKey,
      ...this.noResponse(),
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
      ...this.noResponse(),
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
      ...this.noResponse(),
    } as RenderText;
  }

  public writeDoneMessage(
    tKey = "bot.info.messages.done",
    doneText = this.i18n.t("bot.reactions.messages.done"),
  ): RenderText {
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, { done: doneText }),
      key: tKey,
      ...this.noResponse(),
    };
  }

  public writeSkipMessage(skipText: string): RenderText {
    const tKey = "bot.info.messages.skip";
    return {
      type: RenderType.TEXT,
      text: this.i18n.t(tKey, { skip: skipText }),
      key: tKey,
      ...this.noResponse(),
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

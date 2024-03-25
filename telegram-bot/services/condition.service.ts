import { BaseService } from "../core/index.ts";
import { CalloutComponentSchema, Singleton } from "../deps/index.ts";
import { ReplayType } from "../enums/index.ts";
import { I18nService } from "./i18n.service.ts";
import { filterMimeTypesByPatterns } from "../utils/index.ts";

import type {
  ReplayConditionAny,
  ReplayConditionCalloutComponentSchema,
  ReplayConditionFile,
  ReplayConditionNone,
  ReplayConditionSelection,
  ReplayConditionText,
} from "../types/index.ts";

/**
 * Define conditions for a replay.
 */
@Singleton()
export class ConditionService extends BaseService {
  constructor(protected readonly i18n: I18nService) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /** No replay / answer is expected */
  public replayConditionNone(
    multiple = false,
    required = false,
  ): ReplayConditionNone {
    return {
      type: ReplayType.NONE,
      multiple,
      required,
      doneTexts: [],
      skipTexts: [],
    };
  }

  protected validateArgs(
    multiple: boolean,
    required: boolean,
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ) {
    if (multiple && !doneTexts.length) {
      throw new Error("Multiple condition must have done texts");
    }

    if (!required && !skipTexts.length) {
      const error = new Error("Optional condition must have skip texts");
      console.error(error, { multiple, required, doneTexts, skipTexts });
      throw error;
    }
  }

  /** Any replay / answer is expected */
  public replayConditionAny(
    multiple: boolean,
    required: boolean,
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ): ReplayConditionAny {
    const result: ReplayConditionAny = {
      type: ReplayType.ANY,
      multiple,
      required,
      doneTexts,
      skipTexts,
    };
    this.validateArgs(multiple, required, doneTexts, skipTexts);
    return result;
  }

  /**
   * A text replay / answer is expected
   * - Define a specific message that is accepted to mark an answer as done
   * - Define a specific message to accepted messages before the message is marked as done
   */
  public replayConditionText(
    multiple: boolean,
    required: boolean,
    texts?: string[],
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ): ReplayConditionText {
    const result: ReplayConditionText = {
      type: ReplayType.TEXT,
      multiple,
      required,
      doneTexts,
      skipTexts,
      texts,
    };
    this.validateArgs(multiple, required, doneTexts, skipTexts);
    return result;
  }

  /**
   * Only accept a specific message which must be a selection of the options.
   * @param multiple
   * @param valueLabel
   * @returns
   */
  public replayConditionSelection(
    multiple: boolean,
    required: boolean,
    valueLabel: Record<string, string>,
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ): ReplayConditionSelection {
    const result: ReplayConditionSelection = {
      type: ReplayType.SELECTION,
      multiple,
      required,
      valueLabel,
      doneTexts,
      skipTexts,
    };
    this.validateArgs(multiple, required, doneTexts, skipTexts);
    return result;
  }

  /**
   * - Define a specific file that is accepted to mark an answer as done
   * - Define a specific file to accepted files before before the message is marked as done
   */
  public replayConditionFile(
    multiple: boolean,
    required: boolean,
    mimeTypes: string[] = [],
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ): ReplayConditionFile {
    const result: ReplayConditionFile = {
      type: ReplayType.FILE,
      multiple,
      required,
      mimeTypes,
      doneTexts,
      skipTexts,
    };
    this.validateArgs(multiple, required, doneTexts, skipTexts);
    return result;
  }

  /**
   * - Define a specific or any file that is accepted to mark an answer as done by a file pattern
   * - Define a specific or any file to accepted files before the done file is received by a file pattern
   */
  public replayConditionFilePattern(
    multiple: boolean,
    required: boolean,
    filePattern: string,
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ): ReplayConditionFile {
    const mimeTypes = filterMimeTypesByPatterns(filePattern);
    return this.replayConditionFile(
      multiple,
      required,
      mimeTypes,
      doneTexts,
      skipTexts,
    );
  }

  public replayConditionCalloutComponent(
    multiple: boolean,
    required: boolean,
    schema: CalloutComponentSchema,
    doneTexts: string[] = multiple
      ? [this.i18n.t("bot.reactions.messages.done")]
      : [],
    skipTexts: string[] = !required
      ? [this.i18n.t("bot.reactions.messages.skip")]
      : [],
  ): ReplayConditionCalloutComponentSchema {
    this.validateArgs(multiple, required, doneTexts, skipTexts);
    return {
      type: ReplayType.CALLOUT_COMPONENT_SCHEMA,
      multiple,
      required,
      doneTexts,
      skipTexts,
      schema,
    };
  }
}

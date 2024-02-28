import { CalloutComponentSchema, Singleton } from "../deps.ts";
import { ReplayType } from "../enums/index.ts";
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
export class ConditionService {
  constructor() {
    console.debug(`${this.constructor.name} created`);
  }

  /** No replay / answer is expected */
  public replayConditionNone(multiple = false): ReplayConditionNone {
    return {
      type: ReplayType.NONE,
      multiple,
      doneTexts: [],
    };
  }

  /** Any replay / answer is expected */
  public replayConditionAny(
    multiple: boolean,
    doneTexts: string[] = [],
  ): ReplayConditionAny {
    const result: ReplayConditionAny = {
      type: ReplayType.ANY,
      multiple,
      doneTexts,
    };

    if (multiple && !doneTexts.length) {
      throw new Error("Multiple condition must have done texts");
    }

    return result;
  }

  /**
   * A text replay / answer is expected
   * - Define a specific message that is accepted to mark an answer as done
   * - Define a specific message to accepted messages before the message is marked as done
   */
  public replayConditionText(
    multiple: boolean,
    texts?: string[],
    doneTexts: string[] = [],
  ): ReplayConditionText {
    const result: ReplayConditionText = {
      type: ReplayType.TEXT,
      multiple,
      doneTexts,
      texts,
    };

    if (multiple && !doneTexts.length) {
      throw new Error("Multiple text condition must have done texts");
    }

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
    valueLabel: Record<string, string>,
    doneTexts: string[] = [],
  ): ReplayConditionSelection {
    const result: ReplayConditionSelection = {
      type: ReplayType.SELECTION,
      multiple,
      valueLabel,
      doneTexts,
    };

    if (multiple && !doneTexts.length) {
      throw new Error("Multiple selection condition must have done texts");
    }

    return result;
  }

  /**
   * - Define a specific file that is accepted to mark an answer as done
   * - Define a specific file to accepted files before before the message is marked as done
   */
  public replayConditionFile(
    multiple: boolean,
    mimeTypes: string[] = [],
    doneTexts: string[] = [],
  ): ReplayConditionFile {
    const result: ReplayConditionFile = {
      type: ReplayType.FILE,
      multiple,
      mimeTypes,
      doneTexts,
    };

    if (multiple && !doneTexts.length) {
      throw new Error("Multiple file condition must have done texts");
    }

    return result;
  }

  /**
   * - Define a specific or any file that is accepted to mark an answer as done by a file pattern
   * - Define a specific or any file to accepted files before the done file is received by a file pattern
   */
  public replayConditionFilePattern(
    multiple: boolean,
    filePattern: string,
    doneTexts: string[] = [],
  ): ReplayConditionFile {
    const mimeTypes = filterMimeTypesByPatterns(filePattern);
    return this.replayConditionFile(multiple, mimeTypes, doneTexts);
  }

  public replayConditionCalloutConponent(
    multiple: boolean,
    schema: CalloutComponentSchema,
    doneTexts: string[] = [],
  ): ReplayConditionCalloutComponentSchema {
    return {
      type: ReplayType.CALLOUT_COMPONENT_SCHEMA,
      multiple,
      doneTexts,
      schema,
    };
  }
}

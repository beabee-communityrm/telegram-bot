import { Singleton } from "alosaur/mod.ts";
import { RelayAcceptedFileType, ReplayType } from "../enums/index.ts";
import {
  extractNumbers,
  getFileIdFromMessage,
  getTextFromMessage,
  isNumber,
} from "../utils/index.ts";
import {
  filterMimeTypesByPatterns,
  getSimpleMimeTypes,
} from "../utils/index.ts";

import type {
  Message,
  ReplayAccepted,
  ReplayAcceptedFile,
  ReplayAcceptedNone,
  ReplayAcceptedSelection,
  ReplayAcceptedText,
  ReplayCondition,
  ReplayConditionAny,
  ReplayConditionFile,
  ReplayConditionNone,
  ReplayConditionSelection,
  ReplayConditionText,
} from "../types/index.ts";
import { Context } from "../types/grammy.ts";

/**
 * Define and check conditions for a replay
 */
@Singleton()
export class ConditionService {
  constructor() {
    console.debug(`${ConditionService.name} created`);
  }

  public replayConditionNone(multiple = false): ReplayConditionNone {
    return {
      type: ReplayType.NONE,
      multiple,
      doneTexts: [],
    };
  }

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

  protected messageIsAudioFile(message: Message) {
    return !!message.audio?.file_id || !!message.voice?.file_id ||
      message.document?.mime_type?.startsWith("audio");
  }

  protected messageIsPhotoFile(message: Message) {
    return !!message.photo?.length ||
      message.document?.mime_type?.startsWith("image");
  }

  protected messageIsVideoFile(message: Message) {
    return !!message.video?.file_id || !!message.animation?.file_id ||
      message.document?.mime_type?.startsWith("video");
  }

  protected messageIsDocumentFile(message: Message) {
    return !!message.document?.file_id;
  }

  protected messageIsContact(message: Message) {
    return !!message.contact;
  }

  protected messageIsLocation(message: Message) {
    return !!message.venue?.location || !!message.location;
  }

  protected messageIsAddress(message: Message) {
    return !!message.venue?.address; // + message.venue?.title
  }

  protected messageIsAnyFile(message: Message) {
    return this.messageIsPhotoFile(message) ||
      this.messageIsDocumentFile(message) ||
      this.messageIsVideoFile(message) ||
      this.messageIsAudioFile(message) || false;
    // TODO:
    // this.messageIsLocation(message) ||
    // this.messageIsContact(message) ||
    // this.messageIsAddress(message);
  }

  /**
   * Check if a message is a file message and if the mime type is accepted
   */
  protected messageIsFile(
    context: Context,
    accepted: ReplayConditionFile,
  ): ReplayAcceptedFile {
    const message = context.message;
    let fileType: RelayAcceptedFileType = RelayAcceptedFileType.ANY;
    // Is not a file message
    if (!message) {
      console.warn("Message is undefined");
      return {
        type: ReplayType.FILE,
        accepted: false,
        fileType,
        isDone: false,
        context,
      };
    }
    // Is a file message and all mime types are accepted
    if (!accepted.mimeTypes || !accepted.mimeTypes.length) {
      const isAccepted = this.messageIsAnyFile(message);
      return {
        type: ReplayType.FILE,
        accepted: isAccepted,
        isDone: isAccepted && !accepted.multiple,
        context,
      };
    }
    const simpleTypes = getSimpleMimeTypes(accepted.mimeTypes);
    const photoAccepted = simpleTypes.some((m) => m === "image");
    const documentAccepted = simpleTypes.some((m) => m === "document");
    const videoAccepted = simpleTypes.some((m) => m === "video");
    const audioAccepted = simpleTypes.some((m) => m === "audio");
    // TODO: Can we do this this way? Note: We can reply directly with the location using Telegram
    const locationAccepted = simpleTypes.some((m) => m === "location");
    // TODO: What is the mime type for contact? Note: We can share contacts in Telegram
    const contactAccepted = simpleTypes.some((m) => m === "contact");
    // TODO: Can we do this this way? Note: We can reply directly with the location using Telegram
    const addressAccepted = simpleTypes.some((m) => m === "address");

    if (photoAccepted && this.messageIsPhotoFile(message)) {
      fileType = RelayAcceptedFileType.PHOTO;
    }
    if (documentAccepted && this.messageIsDocumentFile(message)) {
      fileType = RelayAcceptedFileType.DOCUMENT;
    }
    if (videoAccepted && this.messageIsVideoFile(message)) {
      fileType = RelayAcceptedFileType.VIDEO; // or animation or document with mime type video
    }
    if (audioAccepted && this.messageIsAudioFile(message)) {
      fileType = RelayAcceptedFileType.AUDIO; // or voice or document with mime type audio
    }

    // TODO: This are not file types...
    if (locationAccepted && this.messageIsLocation(message)) {
      fileType = RelayAcceptedFileType.LOCATION;
    }
    if (contactAccepted && this.messageIsContact(message)) {
      fileType = RelayAcceptedFileType.CONTACT;
    }
    if (addressAccepted && this.messageIsAddress(message)) {
      fileType = RelayAcceptedFileType.ADDRESS;
    }

    // A file message with accepted mime type
    const isAccepted = fileType !== RelayAcceptedFileType.ANY;
    return {
      type: ReplayType.FILE,
      accepted: isAccepted,
      isDone: isAccepted && !accepted.multiple,
      fileType,
      fileId: getFileIdFromMessage(message),
      context,
    };
  }

  protected messageIsDoneText(
    context: Context,
    accepted: ReplayCondition,
  ): ReplayAcceptedText | ReplayAcceptedNone {
    const textMessage = getTextFromMessage(context.message);

    // Is not a text message or empty
    if (!textMessage) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDone: false,
        context,
      };
    }

    if (accepted.multiple && accepted.doneTexts?.length) {
      const doneTexts = accepted.doneTexts.map((t) => t.toLowerCase().trim());
      const isDone = doneTexts.some((t) => t === textMessage);
      if (isDone) {
        return {
          type: ReplayType.TEXT,
          accepted: true,
          isDone,
          text: textMessage,
          context,
        };
      }
    }

    return {
      type: ReplayType.TEXT,
      accepted: false,
      isDone: false,
      context,
    };
  }

  /**
   * Check if a message is a text message and if the text is accepted
   */
  protected messageIsText(
    context: Context,
    accepted: ReplayConditionText,
  ): ReplayAcceptedText {
    const message = context.message;
    const texts = accepted.texts?.map((t) => t.toLowerCase().trim());
    const originalText = message?.text?.trim();
    if (message?.text) {
      message.text = message.text.toLowerCase().trim();
    }

    // Is not a text message
    if (!message || !message.text) {
      return {
        type: ReplayType.TEXT,
        accepted: false,
        isDone: false,
        text: originalText,
        context,
      };
    }

    // Is a text message and all texts are accepted
    if (!texts || !texts.length) {
      return {
        type: ReplayType.TEXT,
        accepted: true,
        isDone: !accepted.multiple,
        text: originalText,
        context,
      };
    }
    // Is a text message and one of the texts is accepted
    // TODO: This is the DONE_MESSAGE, we should make this clear
    return {
      type: ReplayType.TEXT,
      accepted: true,
      isDone: texts.some((t) => t === message.text),
      text: originalText,
      context,
    };
  }

  /**
   * A selection message is accepted if the message is a number
   * and the number is in the range of the options
   * or the message is the value of the option.
   * @param message
   * @param accepted
   * @returns
   */
  protected messageIsSelection(
    context: Context,
    accepted: ReplayConditionSelection,
  ): ReplayAcceptedSelection {
    const message = context.message;
    const text = getTextFromMessage(message).toLowerCase();

    // The answer message can be the index of the value but starts with 1
    if (isNumber(text)) {
      const index1 = extractNumbers(text);
      const keys = Object.keys(accepted.valueLabel);
      const value = keys[index1 - 1];
      if (value) {
        return {
          type: ReplayType.SELECTION,
          accepted: true,
          isDone: !accepted.multiple,
          value,
          context,
        };
      }
    }

    // The answer message can be the value directly
    const acceptedValue = Object.keys(accepted.valueLabel).find(
      (key) => accepted.valueLabel[key].toLowerCase() === text,
    );
    const isAccepted = !!acceptedValue;
    return {
      type: ReplayType.SELECTION,
      accepted: isAccepted,
      isDone: isAccepted && !accepted.multiple,
      value: acceptedValue,
      context,
    };
  }

  public messageIsAccepted(
    accepted: ReplayCondition,
    context: Context,
  ): ReplayAccepted {
    // If multiple messages are accepted, check if the message is a done text
    if (accepted.multiple && accepted.doneTexts.length) {
      const isText = this.messageIsDoneText(context, accepted);
      if (isText.isDone) {
        return isText;
      }
    }

    // Any response is accepted
    if (
      accepted.type === ReplayType.ANY
    ) {
      return {
        type: ReplayType.ANY,
        accepted: true,
        isDone: !accepted.multiple,
        context,
      };
    }

    // No response is accepted
    if (accepted.type === ReplayType.NONE) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDone: true,
        context,
      };
    }

    // File response is accepted
    if (accepted.type === ReplayType.FILE) {
      const isFile = this.messageIsFile(context, accepted);
      return isFile;
    }

    // Text response is accepted
    if (accepted.type === ReplayType.TEXT) {
      const isText = this.messageIsText(context, accepted);
      return isText;
    }

    // Selection response is accepted
    if (accepted.type === ReplayType.SELECTION) {
      const isSelection = this.messageIsSelection(
        context,
        accepted,
      );
      return isSelection;
    }

    throw new Error(
      `Unknown replay until type: "${(accepted as ReplayCondition)?.type}"`,
    );
  }
}

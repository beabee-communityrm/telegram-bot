import {
  CalloutComponentType,
  calloutComponentValidator,
  Singleton,
} from "../deps.ts";
import { RelayAcceptedFileType, ReplayType } from "../enums/index.ts";
import {
  extractNumbers,
  getFileIdFromMessage,
  getSimpleMimeTypes,
  getTextFromMessage,
  isNumber,
} from "../utils/index.ts";

import { TransformService } from "./transform.service.ts";

import type {
  Message,
  ReplayAccepted,
  ReplayAcceptedFile,
  ReplayAcceptedNone,
  ReplayAcceptedSelection,
  ReplayAcceptedText,
  ReplayCondition,
  ReplayConditionCalloutComponentSchema,
  ReplayConditionFile,
  ReplayConditionSelection,
  ReplayConditionText,
} from "../types/index.ts";
import type { Context } from "../types/grammy.ts";
import { ReplayAcceptedCalloutComponentSchema } from "../types/replay-accepted-callout-component-schema.ts";

/**
 * Check conditions for a replay.
 * This class checks replays messages for conditions which can also be used for other things than Callouts.
 */
@Singleton()
export class ValidationService {
  constructor(protected readonly transform: TransformService) {
    console.debug(`${this.constructor.name} created`);
  }

  protected messageIsAudioFile(message: Message) {
    return (
      !!message.audio?.file_id ||
      !!message.voice?.file_id ||
      message.document?.mime_type?.startsWith("audio")
    );
  }

  protected messageIsPhotoFile(message: Message) {
    return (
      !!message.photo?.length ||
      message.document?.mime_type?.startsWith("image")
    );
  }

  protected messageIsVideoFile(message: Message) {
    return (
      !!message.video?.file_id ||
      !!message.animation?.file_id ||
      message.document?.mime_type?.startsWith("video")
    );
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
    return (
      this.messageIsPhotoFile(message) ||
      this.messageIsDocumentFile(message) ||
      this.messageIsVideoFile(message) ||
      this.messageIsAudioFile(message) ||
      false
    );
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
    // Capitalisation should not play a role for done messages, see https://github.com/beabee-communityrm/telegram-bot/issues/5
    const textMessage = getTextFromMessage(context.message)
      ?.toLowerCase()
      .trim();

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
      type: ReplayType.NONE,
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
  ): ReplayAcceptedText | ReplayAcceptedNone {
    const message = context.message;
    const texts = accepted.texts?.map((t) => t.toLowerCase().trim());
    const originalText = message?.text?.trim();
    const lowerCaseText = originalText?.toLowerCase();

    // Is not a text message
    if (!message || !originalText || !lowerCaseText) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDone: false,
        context,
      };
    }

    // If not texts are defined, all texts are accepted
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
    const match = texts.some((t) => t === message.text);
    if (!match) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDone: false,
        context,
      } as ReplayAcceptedNone;
    }

    return {
      type: ReplayType.TEXT,
      accepted: true,
      isDone: !accepted.multiple,
      text: originalText,
      context,
    } as ReplayAcceptedText;
  }

  /**
   * A selection message is accepted if the message is a number
   * and the number is in the range of the options
   * or the message is the value of the option.
   * @param context
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

  /**
   * A callout component message is accepted if the message passes the callout validator.
   * @param context
   * @param accepted
   * @returns
   */
  protected messageIsCalloutComponent(
    context: Context,
    accepted: ReplayConditionCalloutComponentSchema,
  ): ReplayAcceptedCalloutComponentSchema | ReplayAcceptedNone {
    const result: ReplayAcceptedCalloutComponentSchema = {
      type: ReplayType.CALLOUT_COMPONENT_SCHEMA,
      accepted: false,
      isDone: false,
      answer: undefined,
      context,
    };

    switch (accepted.schema.type) {
      case CalloutComponentType.CONTENT: {
        // No answer is expected
        return {
          type: ReplayType.NONE,
          accepted: false,
          isDone: true,
          context,
        };
      }
      case CalloutComponentType.INPUT_CHECKBOX: {
        result.answer = this.transform.parseResponseBoolean(context);
        break;
      }
      case CalloutComponentType.INPUT_FILE:
      case CalloutComponentType.INPUT_SIGNATURE: {
        result.answer = this.transform.parseResponseFile(context);
        break;
      }
      case CalloutComponentType.INPUT_ADDRESS:
      case CalloutComponentType.INPUT_CURRENCY:
      case CalloutComponentType.INPUT_DATE_TIME:
      case CalloutComponentType.INPUT_EMAIL:
      case CalloutComponentType.INPUT_PHONE_NUMBER:
      case CalloutComponentType.INPUT_TEXT_AREA:
      case CalloutComponentType.INPUT_TEXT_FIELD:
      case CalloutComponentType.INPUT_TIME: {
        result.answer = this.transform.parseResponseText(context);
        break;
      }
      case CalloutComponentType.INPUT_URL: {
        result.answer = this.transform.parseResponseCalloutComponentInputUrl(context);
        break;
      }
      
      case CalloutComponentType.INPUT_NUMBER: {
        result.answer = this.transform.parseResponseNumber(context);
        break;
      }

      case CalloutComponentType.INPUT_SELECT:
      case CalloutComponentType.INPUT_SELECTABLE_RADIO:
      case CalloutComponentType.INPUT_SELECTABLE_SELECTBOXES: {
        throw new Error("Not implemented");
        // this.messageIsSelection(context, accepted);
        // result.answer = this.transform.parseResponseSelection(
        //   context,
        //   accepted,
        // );
        // break;
      }

      case CalloutComponentType.NESTABLE_PANEL:
      case CalloutComponentType.NESTABLE_TABS:
      case CalloutComponentType.NESTABLE_WELL:
        throw new Error("Not implemented");
      default:
        throw new Error(`Unknown callout component type`);
    }

    const isValid = calloutComponentValidator(accepted.schema, result.answer);
    result.accepted = isValid;
    result.isDone = isValid && !accepted.multiple;

    return result;
  }

  /**
   * Check if a message is accepted by a condition
   * @param accepted
   * @param context
   * @returns
   */
  public messageIsAccepted(
    context: Context,
    accepted: ReplayCondition,
  ): ReplayAccepted {
    // If multiple messages are accepted, check if the message is a done text
    if (accepted.multiple && accepted.doneTexts.length) {
      const isText = this.messageIsDoneText(context, accepted);
      if (isText.isDone) {
        return isText;
      }
    }

    // Any response is accepted
    if (accepted.type === ReplayType.ANY) {
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
      const isSelection = this.messageIsSelection(context, accepted);
      return isSelection;
    }

    // Callout component response answer is accepted
    if (accepted.type === ReplayType.CALLOUT_COMPONENT_SCHEMA) {
      const isCalloutAnswer = this.messageIsCalloutComponent(context, accepted);
      return isCalloutAnswer;
    }

    throw new Error(
      `Unknown replay until type: "${(accepted as ReplayCondition)?.type}"`,
    );
  }
}

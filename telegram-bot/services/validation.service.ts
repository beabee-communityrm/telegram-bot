import { BaseService } from "../core/index.ts";
import {
  CalloutComponentType,
  calloutComponentValidator,
  MaybeInaccessibleMessage,
  Message,
  Singleton,
} from "../deps/index.ts";
import { RelayAcceptedFileType, ReplayType } from "../enums/index.ts";
import {
  extractNumbers,
  getFileIdFromMessage,
  getKeyboardButtonFromCallbackQuery,
  getSimpleMimeTypes,
  isNumber,
} from "../utils/index.ts";

import { TransformService } from "./transform.service.ts";

import type {
  AppContext,
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
import { ReplayAcceptedCalloutComponentSchema } from "../types/replay-accepted-callout-component-schema.ts";
import { CHECKMARK } from "../constants/index.ts";

/**
 * Check conditions for a replay.
 * This class checks replays messages for conditions which can also be used for other things than Callouts.
 */
@Singleton()
export class ValidationService extends BaseService {
  constructor(protected readonly transform: TransformService) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  protected messageIsAudioFile(message: MaybeInaccessibleMessage) {
    return (
      !!message.audio?.file_id ||
      !!message.voice?.file_id ||
      message.document?.mime_type?.startsWith("audio")
    );
  }

  protected messageIsPhotoFile(message: MaybeInaccessibleMessage) {
    return (
      !!message.photo?.length ||
      message.document?.mime_type?.startsWith("image")
    );
  }

  protected messageIsVideoFile(message: MaybeInaccessibleMessage) {
    return (
      !!message.video?.file_id ||
      !!message.animation?.file_id ||
      message.document?.mime_type?.startsWith("video")
    );
  }

  protected messageIsDocumentFile(message: MaybeInaccessibleMessage) {
    return !!message.document?.file_id;
  }

  protected messageIsContact(message: MaybeInaccessibleMessage) {
    return !!message.contact;
  }

  protected messageIsLocation(message: MaybeInaccessibleMessage) {
    return !!message.venue?.location || !!message.location;
  }

  protected messageIsAddress(message: MaybeInaccessibleMessage) {
    return !!message.venue?.address; // + message.venue?.title
  }

  protected messageIsAnyFile(message: MaybeInaccessibleMessage) {
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
    context: AppContext,
    accepted: ReplayConditionFile,
    message = context.message,
    textMessage = message?.text,
  ): ReplayAcceptedFile {
    textMessage = textMessage?.trim();
    let fileType: RelayAcceptedFileType = RelayAcceptedFileType.ANY;
    // Is not a file message
    if (!message) {
      console.warn("Message is undefined");
      return {
        type: ReplayType.FILE,
        accepted: false,
        fileType,
        isDoneMessage: false,
        isSkipMessage: false,
        context,
      };
    }
    // Is a file message and all mime types are accepted
    if (!accepted.mimeTypes || !accepted.mimeTypes.length) {
      const isAccepted = this.messageIsAnyFile(message);
      return {
        type: ReplayType.FILE,
        accepted: isAccepted,
        isDoneMessage: false,
        isSkipMessage: false,
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
      isDoneMessage: false,
      isSkipMessage: false,
      fileType,
      fileId: getFileIdFromMessage(message),
      context,
    };
  }

  protected messageIsDoneOrSkipText(
    context: AppContext,
    accepted: ReplayCondition,
    message = context.message,
    textMessage = message?.text,
  ): ReplayAcceptedText | ReplayAcceptedNone {
    // Capitalisation should not play a role for done messages, see https://github.com/beabee-communityrm/telegram-bot/issues/5
    textMessage = textMessage?.trim().toLowerCase();

    let isDoneMessage = false;
    let isSkipMessage = false;

    // Is not a text message or empty
    if (!textMessage) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDoneMessage,
        isSkipMessage,
        context,
      };
    }

    if (accepted.multiple && accepted.doneTexts?.length) {
      const doneTexts = accepted.doneTexts.map((t) => t.toLowerCase().trim());
      isDoneMessage = doneTexts.some((t) => t === textMessage);
    }

    if (!accepted.required && accepted.skipTexts?.length) {
      const skipTexts = accepted.skipTexts.map((t) => t.toLowerCase().trim());
      isSkipMessage = skipTexts.some((t) => t === textMessage);
    }

    if (isDoneMessage || isSkipMessage) {
      return {
        type: ReplayType.TEXT,
        accepted: true,
        isDoneMessage,
        isSkipMessage,
        text: textMessage,
        context,
      };
    }

    return {
      type: ReplayType.NONE,
      accepted: false,
      isDoneMessage,
      isSkipMessage,
      context,
    };
  }

  /**
   * Check if a message is a text message and if the text is accepted
   */
  protected messageIsText(
    context: AppContext,
    accepted: ReplayConditionText,
    message = context.message,
    textMessage = message?.text,
  ): ReplayAcceptedText | ReplayAcceptedNone {
    textMessage = textMessage?.trim();
    const texts = accepted.texts?.map((t) => t.toLowerCase().trim());
    const originalText = textMessage;
    const lowerCaseText = textMessage?.toLowerCase();

    const baseResult = {
      isDoneMessage: false,
      isSkipMessage: false,
      context,
    };

    // Is not a text message
    if (!originalText || !lowerCaseText) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        ...baseResult,
      };
    }

    // If no texts are defined, all texts are accepted
    if (!texts || !texts.length) {
      return {
        type: ReplayType.TEXT,
        accepted: true,
        text: originalText,
        ...baseResult,
      };
    }
    // Is one of the texts is accepted
    const match = texts.some((t) => t === lowerCaseText);
    if (!match) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        ...baseResult,
      } as ReplayAcceptedNone;
    }

    return {
      type: ReplayType.TEXT,
      accepted: true,
      text: originalText,
      ...baseResult,
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
    context: AppContext,
    accepted: ReplayConditionSelection,
    message = context.message,
    textMessage = message?.text,
  ): ReplayAcceptedSelection {
    // Remove the checkmark from the message to match the label
    textMessage = textMessage?.replace(CHECKMARK, "").trim().toLowerCase();

    const baseResult = {
      isDoneMessage: false,
      isSkipMessage: false,
      context,
    };

    // The answer message can be the index of the value but starts with 1
    if (isNumber(textMessage)) {
      const index1 = extractNumbers(textMessage);
      const keys = Object.keys(accepted.valueLabel);
      const value = keys[index1 - 1];
      const label = accepted.valueLabel[value];
      if (value) {
        return {
          type: ReplayType.SELECTION,
          accepted: true,
          value,
          label,
          ...baseResult,
        };
      }
    }

    // The answer message can be the value directly
    const acceptedValue = Object.keys(accepted.valueLabel).find(
      (key) => accepted.valueLabel[key].toLowerCase() === textMessage,
    );
    const isAccepted = !!acceptedValue;
    return {
      type: ReplayType.SELECTION,
      accepted: isAccepted,
      value: acceptedValue,
      label: acceptedValue ? accepted.valueLabel[acceptedValue] : undefined,
      ...baseResult,
    };
  }

  /**
   * A callout component message is accepted if the message passes the callout validator.
   * @param context
   * @param accepted
   * @returns
   */
  protected messageIsCalloutComponent(
    context: AppContext,
    accepted: ReplayConditionCalloutComponentSchema,
    message?: Message,
    textMessage = message?.text,
  ): ReplayAcceptedCalloutComponentSchema | ReplayAcceptedNone {
    textMessage = textMessage?.trim();
    const baseResult = {
      isDoneMessage: false,
      isSkipMessage: false,
      context,
    };

    const result: ReplayAcceptedCalloutComponentSchema = {
      type: ReplayType.CALLOUT_COMPONENT_SCHEMA,
      accepted: false,
      answer: undefined,
      ...baseResult,
    };

    switch (accepted.schema.type) {
      case CalloutComponentType.CONTENT: {
        // No answer is expected
        return {
          type: ReplayType.NONE,
          accepted: false,
          ...baseResult,
        };
      }
      case CalloutComponentType.INPUT_CHECKBOX: {
        result.answer = this.transform.parseResponseBoolean(textMessage);
        break;
      }
      case CalloutComponentType.INPUT_FILE:
      case CalloutComponentType.INPUT_SIGNATURE: {
        result.answer = this.transform.parseResponseFile(message);
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
        result.answer = this.transform.parseResponseText(textMessage);
        break;
      }
      case CalloutComponentType.INPUT_URL: {
        result.answer = this.transform.parseResponseCalloutComponentInputUrl(
          textMessage,
        );
        break;
      }

      case CalloutComponentType.INPUT_NUMBER: {
        result.answer = this.transform.parseResponseNumber(textMessage);
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
    return result;
  }

  /**
   * Check if a message is accepted by a condition.
   * @param accepted
   * @param context
   * @returns
   */
  public messageIsAccepted(
    context: AppContext,
    accepted: ReplayCondition,
    message = context.message,
    textMessage = message?.text,
  ): ReplayAccepted {
    const isDoneOrSkip = this.messageIsDoneOrSkipText(
      context,
      accepted,
      message,
      textMessage,
    );
    if (
      isDoneOrSkip.accepted &&
      (isDoneOrSkip.isDoneMessage || isDoneOrSkip.isSkipMessage)
    ) {
      return isDoneOrSkip;
    }

    // Any response is accepted
    if (accepted.type === ReplayType.ANY) {
      return {
        type: ReplayType.ANY,
        accepted: true,
        isDoneMessage: false,
        isSkipMessage: false,
        context,
      };
    }

    // No response is accepted
    if (accepted.type === ReplayType.NONE) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDoneMessage: false,
        isSkipMessage: false,
        context,
      };
    }

    // File response is accepted
    if (accepted.type === ReplayType.FILE) {
      const isFile = this.messageIsFile(
        context,
        accepted,
        message,
        textMessage,
      );
      return isFile;
    }

    // Text response is accepted
    if (accepted.type === ReplayType.TEXT) {
      const isText = this.messageIsText(
        context,
        accepted,
        message,
        textMessage,
      );
      return isText;
    }

    // Selection response is accepted
    if (accepted.type === ReplayType.SELECTION) {
      const isSelection = this.messageIsSelection(
        context,
        accepted,
        message,
        textMessage,
      );
      return isSelection;
    }

    // Callout component response answer is accepted
    if (accepted.type === ReplayType.CALLOUT_COMPONENT_SCHEMA) {
      const isCalloutAnswer = this.messageIsCalloutComponent(
        context,
        accepted,
        message,
        textMessage,
      );
      return isCalloutAnswer;
    }

    throw new Error(
      `Unknown replay until type: "${(accepted as ReplayCondition)?.type}"`,
    );
  }

  /**
   * Check if a callback query data (inline button event) is accepted by a condition.
   * This method uses {@link messageIsAccepted} but instead of checking the users message text,
   * it uses the button label of the callback query data as the message text.
   * @param accepted
   * @param context
   * @returns
   */
  public callbackQueryDataIsAccepted(
    context: AppContext,
    accepted: ReplayCondition,
    message = context.message,
  ): ReplayAccepted {
    const callbackQueryData = context.callbackQuery?.data;

    if (!callbackQueryData || !context.callbackQuery) {
      throw new Error(
        "[callbackQueryDataIsAccepted] Callback query data is undefined",
      );
    }

    // Use the inline keyboard button label as the message text
    const fakeMessage = getKeyboardButtonFromCallbackQuery(
      context.callbackQuery,
    )?.text;

    return this.messageIsAccepted(
      context,
      accepted,
      message,
      fakeMessage,
    );
  }
}

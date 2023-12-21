import { Singleton } from "alosaur/mod.ts";
import {
  ParsedResponseType,
  RelayAcceptedFileType,
  RenderType,
  ReplayType,
} from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { TransformService } from "./transform.service.ts";
import {
  extractNumbers,
  getIdentifier,
  getTextFromMessage,
  isNumber,
} from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import {
  filterMimeTypesByPatterns,
  getSimpleMimeTypes,
} from "../utils/index.ts";

import type {
  Message,
  Render,
  RenderResponse,
  RenderResponseParsed,
  ReplayAccepted,
  ReplayAcceptedFile,
  ReplayAcceptedSelection,
  ReplayAcceptedText,
  ReplayCondition,
  ReplayConditionAny,
  ReplayConditionFile,
  ReplayConditionNone,
  ReplayConditionSelection,
  ReplayConditionText,
} from "../types/index.ts";
import type { Context } from "grammy/context.ts";

/**
 * Service to handle the communication with the telegram bot and the telegram user.
 */
@Singleton()
export class CommunicationService {
  constructor(
    protected readonly event: EventService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly transform: TransformService,
  ) {
    console.debug(`${CommunicationService.name} created`);
  }

  /**
   * Reply to a Telegram message or action with a single render result
   * @param ctx
   * @param res
   */
  public async send(ctx: Context, res: Render) {
    console.debug("Send", res);
    if (res.type === RenderType.PHOTO) {
      await ctx.replyWithMediaGroup([res.photo]);
      if (res.keyboard) {
        await ctx.reply("Please select an option", {
          reply_markup: res.keyboard,
        });
      }
    } else if (res.type === RenderType.MARKDOWN) {
      await ctx.reply(res.markdown, {
        parse_mode: "MarkdownV2",
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderType.HTML) {
      await ctx.reply(res.html, {
        parse_mode: "HTML",
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderType.TEXT) {
      await ctx.reply(res.text, {
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderType.EMPTY) {
      // Do nothing
    } else {
      throw new Error("Unknown render type: " + (res as Render).type);
    }
  }

  public replayConditionNone(multiple = false): ReplayConditionNone {
    return {
      type: ReplayType.NONE,
      multiple,
    };
  }

  public replayConditionAny(multiple: boolean): ReplayConditionAny {
    return {
      type: ReplayType.ANY,
      multiple,
    };
  }

  /**
   * - Define a specific message that is accepted to mark an answer as done
   * - Define a specific message to accepted messages before the message is marked as done
   */
  public replayConditionText(
    multiple: boolean,
    text?: string,
  ): ReplayConditionText {
    const result: ReplayConditionText = {
      type: ReplayType.TEXT,
      multiple,
    };
    if (text) {
      result.texts = text ? [text] : undefined;
    }
    return result;
  }

  public replayConditionSelection(
    multiple: boolean,
    valueLabel: Record<string, string>,
  ): ReplayConditionSelection {
    const result: ReplayConditionSelection = {
      type: ReplayType.SELECTION,
      multiple,
      valueLabel,
    };
    return result;
  }

  /**
   * - Define a specific file that is accepted to mark an answer as done
   * - Define a specific file to accepted files before before the message is marked as done
   * @param mimeTypes
   * @returns
   */
  public replayConditionFile(
    multiple: boolean,
    mimeTypes: string[] = [],
  ): ReplayConditionFile {
    const result: ReplayConditionFile = {
      type: ReplayType.FILE,
      multiple,
      mimeTypes,
    };
    return result;
  }

  /**
   * - Define a specific or any file that is accepted to mark an answer as done by a file pattern
   * - Define a specific or any file to accepted files before the done file is received by a file pattern
   * @param filePattern
   * @returns
   */
  public replayConditionFilePattern(
    multiple: boolean,
    filePattern: string,
  ): ReplayConditionFile {
    const mimeTypes = filterMimeTypesByPatterns(filePattern);
    return this.replayConditionFile(multiple, mimeTypes);
  }

  /**
   * Wait for any message to be received.
   * TODO: Store event to be able to unsubscribe all unused events if the user stops the conversation or presses a button to answer instead
   * @param ctx
   * @returns
   */
  public async receiveMessage(ctx: Context) {
    const event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    return event.detail;
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
   * @param message
   * @param mimeTypes
   * @returns
   */
  protected messageIsFile(
    message?: Message,
    mimeTypes?: string[],
  ): ReplayAcceptedFile {
    let fileType: RelayAcceptedFileType = RelayAcceptedFileType.ANY;
    // Is not a file message
    if (!message) {
      console.warn("Message is undefined");
      return {
        type: ReplayType.FILE,
        accepted: false,
        fileType,
        isDone: false,
      };
    }
    // Is a file message and all mime types are accepted
    if (!mimeTypes || !mimeTypes.length) {
      return {
        type: ReplayType.FILE,
        accepted: this.messageIsAnyFile(message),
        isDone: false,
      };
    }
    const simpleTypes = getSimpleMimeTypes(mimeTypes);
    const photoAccepted = simpleTypes.some((m) => m === "image");
    const documentAccepted = simpleTypes.some((m) => m === "document");
    const videoAccepted = simpleTypes.some((m) => m === "video");
    const audioAccepted = simpleTypes.some((m) => m === "audio");
    const locationAccepted = simpleTypes.some((m) => m === "location"); // TODO: Can we do this this way? Note: We can reply directly with the location using Telegram
    const contactAccepted = simpleTypes.some((m) => m === "contact"); // TODO: What is the mime type for contact? Note: We can share contacts in Telegram
    const addressAccepted = simpleTypes.some((m) => m === "address"); // TODO: Can we do this this way? Note: We can reply directly with the location using Telegram

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
    return {
      type: ReplayType.FILE,
      accepted: fileType !== RelayAcceptedFileType.ANY,
      isDone: false,
      fileType,
    };
  }

  /**
   * Check if a message is a text message and if the text is accepted
   * @param message
   * @param text
   * @returns
   */
  protected messageIsText(
    message?: Message,
    texts?: string[],
  ): ReplayAcceptedText {
    texts = texts?.map((t) => t.toLowerCase().trim());
    if (message?.text) {
      message.text = message.text.toLowerCase().trim();
    }

    // Is not a text message
    if (!message || !message.text) {
      return {
        type: ReplayType.TEXT,
        accepted: false,
        isDone: false,
      };
    }
    // Is a text message and all texts are accepted but not done
    if (!texts || !texts.length) {
      return {
        type: ReplayType.TEXT,
        accepted: true,
        isDone: false,
      };
    }
    // Is a text message and one of the texts is accepted
    return {
      type: ReplayType.TEXT,
      accepted: true,
      isDone: texts.some((t) => t === message.text),
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
    message: Message,
    accepted: ReplayConditionSelection,
  ): ReplayAcceptedSelection {
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
          isDone: true,
          value,
        };
      }
    }

    // The answer message can be the value directly
    const acceptedValue = accepted.valueLabel[text];
    return {
      type: ReplayType.SELECTION,
      accepted: !!acceptedValue,
      isDone: !!acceptedValue,
      value: acceptedValue,
    };
  }

  /**
   * Wait for a specific message to be received and collect all messages of type `acceptedBefore` until the specific message is received.
   * @param ctx
   * @param render
   * @returns
   */
  protected async acceptedUntilSpecificMessage(
    ctx: Context,
    render: Render,
  ) {
    let context: Context;
    let message: Message | undefined;
    const replayTexts: Context[] = [];

    if (render.accepted.type === ReplayType.NONE) {
      return [];
    }

    let isAccepted: ReplayAccepted | undefined;

    do {
      context = await this.receiveMessage(ctx);
      message = context.message;

      if (!message) {
        console.warn("Message is undefined");
        continue;
      }

      isAccepted = this.messageIsAccepted(
        render.accepted,
        message,
      );

      if (!isAccepted.accepted) {
        console.debug(
          `Message is not accepted: ${
            JSON.stringify(isAccepted, null, 2)
          }\nrender: ${JSON.stringify(render, null, 2)}`,
        );
        await this.send(
          ctx,
          this.messageRenderer.notAcceptedMessage(
            isAccepted,
            render.accepted as ReplayConditionFile,
          ),
        );
        continue;
      }

      // Message is accepted, so store it but do not store the done message
      if (!isAccepted.isDone) {
        replayTexts.push(context);
        // Stop collecting messages if only one message is accepted
        if (!render.accepted.multiple) {
          isAccepted.isDone = true;
        }
      }
    } while (!isAccepted?.isDone);

    return replayTexts;
  }

  protected messageIsAccepted(
    accepted: ReplayCondition,
    message: Message,
  ): ReplayAccepted {
    if (
      accepted.type === ReplayType.ANY && !accepted.mimeTypes?.length &&
      !accepted.texts?.length
    ) {
      return {
        type: ReplayType.ANY,
        accepted: true,
        isDone: true,
      };
    }

    // No response is accepted
    if (accepted.type === ReplayType.NONE) {
      return {
        type: ReplayType.NONE,
        accepted: false,
        isDone: true,
      };
    }

    if (accepted.type === ReplayType.FILE) {
      const isFile = this.messageIsFile(message, accepted.mimeTypes);
      return isFile;
    }

    if (accepted.type === ReplayType.TEXT) {
      const isText = this.messageIsText(message, accepted.texts);
      return isText;
    }

    if (accepted.type === ReplayType.SELECTION) {
      const isSelection = this.messageIsSelection(
        message,
        accepted as ReplayConditionSelection,
      );
      return isSelection;
    }

    throw new Error(
      `Unknown replay until type: "${(accepted as ReplayCondition)?.type}"`,
    );
  }

  /**
   * Wait for a specific message or file to be received and collect all messages of type `acceptedBefore` until the specific message is received
   * @param ctx
   * @param acceptedUntil
   * @returns
   */
  public async receive(
    ctx: Context,
    render: Render,
  ): Promise<RenderResponseParsed<boolean>> {
    // Do not wait for a specific message
    if (
      !render.accepted || render.accepted.type === ReplayType.NONE
    ) {
      return {
        type: ParsedResponseType.NONE,
        multiple: false,
        context: ctx,
        data: null,
      };
    }

    // Receive the first message of specific type
    if (!render.accepted.multiple) {
      const context = await this.receiveMessage(ctx);
      const res: RenderResponseParsed<false> = {
        type: render.parseType,
        multiple: false,
        context,
        data: this.transform.parseResponse(context, render.parseType),
      };
      return res;
    }

    // Receive all messages of specific type until a message of specific type is received
    const contexts = await this.acceptedUntilSpecificMessage(
      ctx,
      render,
    );
    const res = {
      type: render.parseType,
      multiple: true,
      context: contexts,
      data: this.transform.parseResponses(contexts, render.parseType),
    } as RenderResponseParsed<true>;
    return res;
  }

  /**
   * Send a render result and wait for a message response until a specific message or file is received.
   * @param ctx
   * @param render
   * @returns
   */
  public async sendAndReceive(ctx: Context, render: Render) {
    await this.send(ctx, render);

    const responses = await this.receive(
      ctx,
      render,
    );
    const response: RenderResponse = {
      render,
      responses,
    };
    return response;
  }

  /**
   * Send multiple render results and wait for a message response until a specific message or file is received if `acceptedUntil` is defined.
   * @param ctx
   * @param renders
   */
  public async sendAndReceiveAll(
    ctx: Context,
    renders: Render[],
  ) {
    const responses: RenderResponse[] = [];
    for (const render of renders) {
      const response = await this.sendAndReceive(ctx, render);
      if (response) {
        responses.push(response);
      }
    }
    return responses;
  }
}

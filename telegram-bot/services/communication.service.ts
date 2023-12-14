import { Singleton } from "alosaur/mod.ts";
import { RelayAcceptedFileType, RenderResultType } from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { getIdentifier } from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import {
  filterMimeTypesByPatterns,
  getSimpleMimeTypes,
} from "../utils/index.ts";

import type {
  Message,
  RenderResult,
  Replay,
  ReplayAccepted,
  ReplayAcceptedFile,
  ReplayAcceptedText,
  ReplayCondition,
  ReplayConditionFile,
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
  ) {
    console.debug(`${CommunicationService.name} created`);
  }

  /**
   * Reply to a Telegram message or action with a single render result
   * @param ctx
   * @param res
   */
  public async send(ctx: Context, res: RenderResult) {
    if (res.type === RenderResultType.PHOTO) {
      await ctx.replyWithMediaGroup([res.photo]);
      if (res.keyboard) {
        await ctx.reply("Please select an option", {
          reply_markup: res.keyboard,
        });
      }
    } else if (res.type === RenderResultType.MARKDOWN) {
      await ctx.reply(res.markdown, {
        parse_mode: "MarkdownV2",
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderResultType.HTML) {
      await ctx.reply(res.html, {
        parse_mode: "HTML",
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderResultType.TEXT) {
      await ctx.reply(res.text, {
        reply_markup: res.keyboard,
      });
    }
  }

  /**
   * Define a specific or any message that is accepted to mark an answer as done
   * Define a specific or any message to accepted messages before the done message is received
   * @param message
   * @returns
   */
  public replayConditionText(text?: string): ReplayConditionText {
    const result: ReplayConditionText = {
      type: "message",
    };
    if (text) {
      result.messages = text ? [text] : undefined;
    }
    return result;
  }

  /**
   * - Define a specific or any file that is accepted to mark an answer as done
   * - Define a specific or any file to accepted files before the done file is received
   * @param mimeTypes
   * @returns
   */
  public replayConditionFile(mimeTypes?: string[]): ReplayConditionFile {
    const result: ReplayConditionFile = {
      type: "file",
    };
    if (mimeTypes) {
      result.mimeTypes = mimeTypes;
    }
    return result;
  }

  /**
   * - Define a specific or any file that is accepted to mark an answer as done by a file pattern
   * - Define a specific or any file to accepted files before the done file is received by a file pattern
   * @param filePattern
   * @returns
   */
  public replayConditionFilePattern(
    filePattern: string,
  ): ReplayConditionFile {
    const mimeTypes = filterMimeTypesByPatterns(filePattern);
    return this.replayConditionFile(mimeTypes);
  }

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

  protected messageIsFile(
    message?: Message,
    mimeTypes?: string[],
  ): ReplayAcceptedFile {
    let fileType: RelayAcceptedFileType = RelayAcceptedFileType.ANY;
    // Is not a file message
    if (!message) {
      return {
        type: "file",
        accepted: false,
        fileType,
      };
    }
    // Is a file message and all mime types are accepted
    if (!mimeTypes) {
      return {
        type: "file",
        accepted: true,
      };
    }
    const simpleTypes = getSimpleMimeTypes(mimeTypes);
    const photoAccepted = simpleTypes.some((m) => m === "image");
    const documentAccepted = simpleTypes.some((m) => m === "document");
    const videoAccepted = simpleTypes.some((m) => m === "video");
    const audioAccepted = simpleTypes.some((m) => m === "audio");
    const locationAccepted = simpleTypes.some((m) => m === "location"); // TODO: Can we do this this way?
    const contactAccepted = simpleTypes.some((m) => m === "contact"); // TODO: What is the mime type for contact?
    const addressAccepted = simpleTypes.some((m) => m === "address"); // TODO: Can we do this this way?

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
    if (locationAccepted && this.messageIsLocation(message)) {
      fileType = RelayAcceptedFileType.LOCATION;
    }
    if (contactAccepted && this.messageIsContact(message)) {
      fileType = RelayAcceptedFileType.CONTACT;
    }
    if (addressAccepted && this.messageIsAddress(message)) {
      fileType = RelayAcceptedFileType.ADDRESS;
    }
    // Is a file message with accepted mime type
    return {
      type: "file",
      accepted: fileType !== RelayAcceptedFileType.ANY,
      fileType,
    };
  }

  protected messageIsText(
    message?: Message,
    text?: string[],
  ): ReplayAcceptedText {
    text = text?.map((t) => t.toLowerCase().trim());
    if (message?.text) {
      message.text = message.text.toLowerCase().trim();
    }

    // Is not a text message
    if (!message || !message.text) {
      return {
        type: "message",
        accepted: false,
      };
    }
    // Is a text message and all texts are accepted
    if (!text) {
      return {
        type: "message",
        accepted: true,
      };
    }
    // Is a text message and one of the texts is accepted
    return {
      type: "message",
      accepted: text.some((t) => t === message.text),
    };
  }

  /**
   * Wait for a specific message to be received and collect all messages of type `acceptedBefore` until the specific message is received
   * @param ctx
   * @param acceptedUntil
   * @param acceptedBefore
   * @returns
   */
  protected async acceptedUntilSpecificMessage(
    ctx: Context,
    acceptedUntil: ReplayCondition,
    acceptedBefore?: ReplayCondition,
  ) {
    let context: Context;
    let message: Message | undefined;
    const replayTexts: Context[] = [];

    let isDone = false;

    do {
      context = await this.receiveMessage(ctx);
      message = context.message;

      if (acceptedUntil.type === "file") {
        isDone = this.messageIsFile(message, acceptedUntil.mimeTypes).accepted;
      }

      if (acceptedUntil.type === "message") {
        isDone = this.messageIsText(message, acceptedUntil.messages).accepted;
      }

      if (isDone) {
        break;
      }

      const isAccepted = this.messageIsAccepted(message, acceptedBefore);

      if (!isAccepted.accepted) {
        await this.send(
          ctx,
          this.messageRenderer.notAcceptedMessage(
            isAccepted,
            (acceptedBefore as ReplayConditionFile).mimeTypes,
          ),
        );
        continue;
      }

      // Message is accepted
      replayTexts.push(context);
    } while (!isDone);

    return replayTexts;
  }

  protected messageIsAccepted(
    message?: Message,
    accepted?: ReplayCondition,
  ): ReplayAccepted {
    if (!accepted) {
      return {
        type: "any",
        accepted: true,
      };
    }

    if (accepted.type === "file") {
      const isFile = this.messageIsFile(message, accepted.mimeTypes);
      return isFile;
    }

    if (accepted.type === "message") {
      const isText = this.messageIsText(message, accepted.messages);
      return isText;
    }

    throw new Error("Unknown replay accepted type");
  }

  /**
   * Wait for a specific message or file to be received and collect all messages of type `acceptedBefore` until the specific message is received
   * @param ctx
   * @param acceptedUntil
   * @returns
   */
  public async receive(
    ctx: Context,
    acceptedUntil?: ReplayCondition,
    acceptedBefore?: ReplayCondition,
  ) {
    // Wait for any message
    if (!acceptedUntil) {
      return [await this.receiveMessage(ctx)];
    }

    // Wait for message
    return await this.acceptedUntilSpecificMessage(
      ctx,
      acceptedUntil,
      acceptedBefore,
    );

    // throw new Error("Unknown replay wait for type");
  }

  /**
   * Send a render result and wait for a message response until a specific message or file is received if `acceptedUntil` is defined.
   * @param ctx
   * @param rendererResult
   * @returns
   */
  public async sendAndReceive(ctx: Context, rendererResult: RenderResult) {
    await this.send(ctx, rendererResult);
    if (rendererResult.acceptedUntil) {
      const replay = await this.receive(
        ctx,
        rendererResult.acceptedUntil,
        rendererResult.acceptedBefore,
      );
      return replay;
    }

    return null;
  }

  /**
   * Send multiple render results and wait for a message response until a specific message or file is received if `acceptedUntil` is defined.
   * @param ctx
   * @param rendererResults
   */
  public async sendAndReceiveAll(
    ctx: Context,
    rendererResults: RenderResult[],
  ) {
    const replays: Replay = [];
    for (const rendererResult of rendererResults) {
      const replay = await this.sendAndReceive(ctx, rendererResult);
      if (replay) {
        replays.push(replay);
      }
    }
  }
}

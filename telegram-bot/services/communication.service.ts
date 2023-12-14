import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { getIdentifier } from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { filterMimeTypesByPatterns } from "../utils/index.ts";
import { DONE_MESSAGE } from "../constants/index.ts";

import type {
  Message,
  RenderResult,
  ReplayAccepted,
  ReplayAcceptedFile,
  ReplayAcceptedMessage,
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
  protected async _reply(ctx: Context, res: RenderResult) {
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

  // TODO: Move to better place
  acceptedUntilMessage(message?: string): ReplayAcceptedMessage {
    const result: ReplayAcceptedMessage = {
      type: "message",
    };
    if (message) {
      result.messages = message ? [message] : undefined;
    }
    return result;
  }

  // TODO: Move to better place
  public acceptedUntilFile(mimeTypes?: string[]): ReplayAcceptedFile {
    const result: ReplayAcceptedFile = {
      type: "file",
    };
    if (mimeTypes) {
      result.mimeTypes = mimeTypes;
    }
    return result;
  }

  // TODO: Move to better place
  public acceptedUntilFilePattern(
    filePattern: string,
  ): ReplayAcceptedFile {
    const mimeTypes = filterMimeTypesByPatterns(filePattern);
    return this.acceptedUntilFile(mimeTypes);
  }

  /**
   * Reply to a Telegram message or action with a a single or multiple render results
   * @param ctx
   * @param res
   */
  public async reply(
    ctx: Context,
    renderResults: RenderResult | RenderResult[],
  ) {
    if (!Array.isArray(renderResults)) {
      renderResults = [renderResults];
    }
    for (const renderResult of renderResults) {
      try {
        await this._reply(ctx, renderResult);
      } catch (error) {
        console.error("Error sending render result", error);
      }
    }
  }

  public async waitForReplayMessage(ctx: Context) {
    const event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    return event.detail;
  }

  /**
   * Wait for a specific file to be received
   * @param ctx
   * @param waitFor
   * @returns
   */
  public async waitForSpecificReplayFileMessage(
    ctx: Context,
    waitFor: ReplayAcceptedFile,
  ) {
    let compareMimeType: string | undefined;
    let context: Context;
    let message: Message | undefined;
    const replayFiles: Context[] = [];
    let wait = false;
    do {
      context = await this.waitForReplayMessage(ctx);
      message = context.message;
      compareMimeType = message?.document?.mime_type;

      if (
        !message || !message.document || !compareMimeType ||
        !message.document.file_id
      ) {
        await this.reply(ctx, this.messageRenderer.notAFileMessage());
        continue;
      }
      replayFiles.push(context);

      if (waitFor.mimeTypes && waitFor.mimeTypes.length > 0) {
        for (const mimeType of waitFor.mimeTypes) {
          if (mimeType === compareMimeType) {
            wait = false;
            break;
          }
          wait = true;
        }
      }
    } while (wait);

    return replayFiles;
  }

  /**
   * Wait for a specific message to be received
   * @param ctx
   * @param waitFor
   * @returns
   */
  public async waitForSpecificReplayTextMessage(
    ctx: Context,
    waitFor: ReplayAcceptedMessage,
  ) {
    let compareText: string | undefined;
    let context: Context;
    let message: Message | undefined;
    const replayMessages: Context[] = [];
    let wait = false;
    do {
      context = await this.waitForReplayMessage(ctx);
      message = context.message;
      compareText = message?.text?.toLowerCase().trim();

      if (!compareText) {
        await this.reply(ctx, this.messageRenderer.notATextMessage());
        continue;
      }
      replayMessages.push(context);

      const waitForMessages = waitFor.messages?.map((m) =>
        m.toLowerCase().trim()
      );

      if (waitForMessages) {
        for (const waitForMessage of waitForMessages) {
          if (waitForMessage === compareText) {
            wait = false;
            break;
          }
          wait = true;
        }
      } else {
        // Wait for any message
        wait = !message || !compareText;
      }
    } while (wait);

    return replayMessages;
  }

  /**
   * Wait for a specific message or file to be received
   * @param ctx
   * @param waitFor
   * @returns
   */
  public async waitForSpecificReplay(
    ctx: Context,
    waitFor: ReplayAccepted,
  ) {
    if (waitFor.type === "file") {
      return await this.waitForSpecificReplayFileMessage(ctx, waitFor);
    }

    if (waitFor.type === "message") {
      return await this.waitForSpecificReplayTextMessage(ctx, waitFor);
    }

    throw new Error("Unknown replay wait for type");
  }

  /**
   * Wait for a `waitForMessage` message to be received
   * @param ctx
   * @param waitForMessage
   * @returns
   */
  public async waitForDoneReplayTextMessage(
    ctx: Context,
    waitForMessage?: string,
  ) {
    return await this.waitForSpecificReplayTextMessage(ctx, {
      type: "message",
      messages: waitForMessage ? [waitForMessage] : undefined,
    });
  }

  /**
   * Reply to a Telegram message or action with a render result and wait for a message response
   */
  public async replayAndWaitForAnyTextMessage(
    ctx: Context,
    renderResult: RenderResult,
  ) {
    await this.reply(ctx, renderResult);
    const replay = await this.waitForDoneReplayTextMessage(ctx);
    return replay[0];
  }

  /**
   * Reply to a Telegram message or action with a render result and wait for a message response until a specific message is received
   */
  public async replayAndWaitForDoneMessage(
    ctx: Context,
    renderResult: RenderResult,
  ) {
    await this.reply(ctx, renderResult);
    const replayMessages = await this.waitForDoneReplayTextMessage(
      ctx,
      DONE_MESSAGE,
    );
    return replayMessages;
  }
}

import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { getIdentifier } from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { DONE_MESSAGE } from "../constants/index.ts";

import type {
  Message,
  RenderResult,
  TelegramBotEvent,
} from "../types/index.ts";
import type { Context } from "grammy/context.ts";

@Singleton()
export class RenderService {
  constructor(
    protected readonly event: EventService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    console.debug(`${RenderService.name} created`);
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
      await this._reply(ctx, renderResult);
    }
  }

  /**
   * Reply to a Telegram message or action with a render result and wait for a message response
   */
  public async replayAndWaitForMessage(
    ctx: Context,
    renderResult: RenderResult,
  ) {
    await this.reply(ctx, renderResult);
    let event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    while (!event.detail.message?.text) {
      await this.reply(ctx, this.messageRenderer.notATextMessage());
      event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    }
    return event.detail;
  }

  /**
   * Reply to a Telegram message or action with a render result and wait for a message response
   */
  public async replayAndWaitForDoneMessage(
    ctx: Context,
    renderResult: RenderResult,
  ) {
    await this.reply(ctx, renderResult);
    let text: string | undefined;
    let event: TelegramBotEvent;
    let context: Context;
    let message: Message | undefined;
    const answerMessages: Context[] = [];
    do {
      event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
      context = event.detail;
      message = context.message;
      text = message?.text?.toLowerCase().trim();

      if (!text) {
        await this.reply(ctx, this.messageRenderer.notATextMessage());
        continue;
      }
      answerMessages.push(context);
    } while (!message || text !== DONE_MESSAGE);

    return answerMessages;
  }
}

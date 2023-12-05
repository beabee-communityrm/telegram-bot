import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { getIdentifier } from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";

import type { RenderResult } from "../types/index.ts";
import type { Context } from "grammy/context.ts";

@Singleton()
export class RenderService {
  constructor(
    protected readonly event: EventService,
    protected readonly messageRenderer: MessageRenderer,
  ) {}

  /**
   * Reply to a Telegram message or action with a render result
   * @param ctx
   * @param res
   */
  public async reply(ctx: Context, res: RenderResult) {
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

  public async replayAndWaitForMessage(ctx: Context, res: RenderResult) {
    await this.reply(ctx, res);
    let event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    while (!event.detail.message?.text) {
      await this.reply(ctx, this.messageRenderer.notATextMessage());
      event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    }
    return event.detail;
  }
}

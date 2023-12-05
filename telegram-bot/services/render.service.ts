import { Singleton } from "alosaur/mod.ts";
import { RenderResultType } from "../enums/index.ts";

import type { RenderResult } from "../types/index.ts";
import type { Context } from "grammy/context.ts";

@Singleton()
export class RenderService {
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
    } else {
      await ctx.reply(res.html, {
        parse_mode: "HTML",
        reply_markup: res.keyboard,
      });
    }
  }
}

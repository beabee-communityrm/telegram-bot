import { Singleton } from "alosaur/mod.ts";
import { Command } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class StartCommand extends Command {
  key = "start";
  command = "start";
  description = "Start the bot";

  constructor(protected readonly i18n: I18nService) {
    super();
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: Context) {
    await ctx.reply("*Hi\\!* _Welcome_ to [beabee](https://beabee.io/)\\.", {
      parse_mode: "MarkdownV2",
    });
  }
}

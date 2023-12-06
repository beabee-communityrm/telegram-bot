import { Singleton } from "alosaur/mod.ts";
import { Command } from "../core/index.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class StartCommand extends Command {
  command = "start";
  description = "Start the bot";

  constructor() {
    super();
    console.debug(`${StartCommand.name} created`);
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: Context) {
    await ctx.reply("*Hi\\!* _Welcome_ to [beabee](https://beabee.io/)\\.", {
      parse_mode: "MarkdownV2",
    });
  }
}

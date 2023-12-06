import { Singleton } from "alosaur/mod.ts";
import { SubscriberService } from "../services/index.ts";
import { Command } from "../core/index.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class SubscribeCommand extends Command {
  command = "subscribe";
  description = "Subscribe a Callout";

  constructor(protected readonly subscriber: SubscriberService) {
    super();
    console.debug(`${SubscribeCommand.name} created`);
  }

  async action(ctx: Context) {
    this.subscriber.create(ctx);
    await ctx.reply("You are now subscribed\!");
  }
}

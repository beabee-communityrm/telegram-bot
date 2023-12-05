import { Singleton } from "alosaur/mod.ts";
import { SubscriberService } from "../services/index.ts";

import type { Command, Context } from "../types/index.ts";

@Singleton()
export class SubscribeCommand implements Command {
  command = "subscribe";
  description = "Subscribe a Callout";

  constructor(protected readonly subscriber: SubscriberService) {
    // ...
  }

  async action(ctx: Context) {
    this.subscriber.create(ctx);
    await ctx.reply("You are now subscribed\!");
  }
}

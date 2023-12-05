import { Singleton } from "alosaur/mod.ts";
import { SubscriberService } from "../services/index.ts";

import type { Command, Context } from "../types/index.ts";

@Singleton()
export class UnsubscribeCommand implements Command {
  command = "unsubscribe";
  description = "Unsubscribe from a Callout";

  constructor(protected readonly subscriber: SubscriberService) {
    // ...
  }

  async action(ctx: Context) {
    this.subscriber.delete(ctx);
    await ctx.reply("You are now unsubscribed\!");
  }
}

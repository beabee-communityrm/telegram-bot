import { Singleton } from "alosaur/mod.ts";
import { SubscriberService } from "../services/index.ts";
import { Command } from "../core/index.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class UnsubscribeCommand extends Command {
  command = "unsubscribe";
  description = "Unsubscribe from a Callout";

  constructor(protected readonly subscriber: SubscriberService) {
    super();
    console.debug(`${UnsubscribeCommand.name} created`);
  }

  async action(ctx: Context) {
    this.subscriber.delete(ctx);
    await ctx.reply("You are now unsubscribed\!");
  }
}

import { Singleton } from "alosaur/mod.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { Command } from "../core/index.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class UnsubscribeCommand extends Command {
  key = "unsubscribe";
  command = "unsubscribe";
  description = "Unsubscribe from a Callout";

  constructor(
    protected readonly subscriber: SubscriberService,
    protected readonly i18n: I18nService,
  ) {
    super();
  }

  async action(ctx: Context) {
    this.subscriber.delete(ctx);
    await ctx.reply("You are now unsubscribed\!");
  }
}

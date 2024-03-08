import { Singleton } from "../deps.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { BaseCommand } from "../core/index.ts";

import type { AppContext, UserState } from "../types/index.ts";

@Singleton()
export class UnsubscribeCommand extends BaseCommand {
  key = "unsubscribe";
  /** `/unsubscribe` */
  command = "unsubscribe";

  visibleOnStates: UserState[] = []; // Only for testing

  constructor(
    protected readonly subscriber: SubscriberService,
    protected readonly i18n: I18nService,
  ) {
    super();
  }

  async action(ctx: AppContext) {
    this.subscriber.delete(ctx);
    await ctx.reply("You are now unsubscribed\!");
  }
}

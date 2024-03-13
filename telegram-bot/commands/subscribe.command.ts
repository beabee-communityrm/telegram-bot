import { Context, Singleton } from "../deps.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { Command } from "../core/index.ts";

import type { UserState } from "../types/user-state.ts";

@Singleton()
export class SubscribeCommand extends Command {
  key = "subscribe";
  command = "subscribe";
  /**
   * Subscribe a Callout
   * (Description is set in CommandService with a translation)
   */
  description = "";

  visibleOnStates: UserState[] = []; // Only for testing

  constructor(
    protected readonly subscriber: SubscriberService,
    protected readonly i18n: I18nService,
  ) {
    super();
  }

  async action(ctx: Context) {
    this.subscriber.create(ctx);
    await ctx.reply("You are now subscribed\!");
  }
}

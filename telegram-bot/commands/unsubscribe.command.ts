import { Singleton } from "../deps/index.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { BaseCommand } from "../core/index.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class UnsubscribeCommand extends BaseCommand {
  /** `/unsubscribe` */
  command = "unsubscribe";

  visibleOnStates: ChatState[] = [ChatState.None]; // TODO: Make this for admins visible

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

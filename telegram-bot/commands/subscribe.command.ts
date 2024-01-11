import { Singleton } from "alosaur/mod.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { Command } from "../core/index.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class SubscribeCommand extends Command {
  command = "subscribe";
  description = "Subscribe a Callout";

  constructor(
    protected readonly subscriber: SubscriberService,
    protected readonly i18n: I18nService,
  ) {
    super();
    this.command = this.i18n.t("commands.subscribe.command");
    this.description = this.i18n.t("commands.subscribe.description");
    console.debug(`${SubscribeCommand.name} created`);
  }

  async action(ctx: Context) {
    this.subscriber.create(ctx);
    await ctx.reply("You are now subscribed\!");
  }
}

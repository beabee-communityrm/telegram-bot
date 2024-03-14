import { Singleton } from "../deps/index.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
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
    protected readonly messageRenderer: MessageRenderer,
    protected readonly communication: CommunicationService,
  ) {
    super();
  }

  async action(ctx: AppContext) {
    const successful = await this.checkAction(ctx);
    if (!successful) {
      return false;
    }
    await this.subscriber.delete(ctx);
    // TODO: Translate
    await ctx.reply("You are now unsubscribed\!");
    return successful;
  }
}

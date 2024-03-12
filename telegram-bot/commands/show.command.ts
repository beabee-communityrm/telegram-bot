import { ClientApiError, Singleton } from "../deps/index.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import {
  CalloutRenderer,
  CalloutResponseRenderer,
  MessageRenderer,
} from "../renderer/index.ts";
import { ChatState } from "../enums/index.ts";

import { BaseCommand } from "../core/index.ts";
import type { AppContext } from "../types/index.ts";

@Singleton()
export class ShowCommand extends BaseCommand {
  /** `/show` */
  command = "show";

  visibleOnStates: ChatState[] = []; // TODO: Make this for admins visible

  constructor(
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly keyboard: KeyboardService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly calloutResponseRenderer: CalloutResponseRenderer,
    protected readonly i18n: I18nService,
  ) {
    super();
  }

  // Handle the /show command
  async action(ctx: AppContext) {
    console.debug("Show command called");

    // Get the slug from the `/show slug` message text
    const slug = ctx.message?.text?.split(" ")[1];

    if (!slug) {
      await ctx.reply("Please specify a callout slug. E.g. `/show my-callout`");
      return;
    }

    try {
      const callout = await this.callout.get(slug);
      const res = await this.calloutRenderer.callout(callout);
      await this.communication.sendAndReceiveAll(ctx, res);
      const session = await ctx.session;
      session.state = ChatState.CalloutDetails;
    } catch (error) {
      console.error("Error sending callout", error);
      if (error instanceof ClientApiError && error.httpCode === 404) {
        await ctx.reply(`Callout with slug "${slug}" not found.`);
        return;
      }
      await ctx.reply(`Error sending callout slug "${slug}": ${error.message}`);
      return;
    }
  }
}

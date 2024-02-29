import { Singleton } from "alosaur/mod.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import {
  CalloutRenderer,
  CalloutResponseRenderer,
  MessageRenderer,
} from "../renderer/index.ts";
import { ApiError } from "../deps.ts";
import { Command } from "../core/index.ts";

import type { Context } from "../types/index.ts";

@Singleton()
export class ShowCommand extends Command {
  key = "show";
  command = "show";
  description = `Shows you information about a specific callout`;

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
  async action(ctx: Context) {
    console.debug("Show command called");

    // Get the slug from the `/show slug` message text
    const slug = ctx.message?.text?.split(" ")[1];

    if (!slug) {
      await ctx.reply("Please specify a callout slug. E.g. `/show my-callout`");
      return;
    }

    try {
      const callout = await this.callout.get(slug);
      console.debug("Got callout", callout);

      const res = await this.calloutRenderer.callout(callout);
      await this.communication.sendAndReceiveAll(ctx, res);
    } catch (error) {
      console.error("Error sending callout", error);
      if (error instanceof ApiError && error.httpCode === 404) {
        await ctx.reply(`Callout with slug "${slug}" not found.`);
        return;
      }
      await ctx.reply(`Error sending callout slug "${slug}": ${error.message}`);
      return;
    }
  }
}

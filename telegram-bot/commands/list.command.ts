import { Singleton } from "alosaur/mod.ts";
import { Command } from "../core/command.ts";
import {
  CalloutService,
  CommunicationService,
  EventService,
  KeyboardService,
} from "../services/index.ts";
import { CalloutRenderer } from "../renderer/index.ts";

import type { Context } from "grammy/context.ts";

@Singleton()
export class ListCommand extends Command {
  command = "list";
  description = "List active Callouts";

  constructor(
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly keyboard: KeyboardService,
    protected readonly event: EventService,
    protected readonly calloutRenderer: CalloutRenderer,
  ) {
    super();
    console.debug(`${ListCommand.name} created`);
  }

  // Handle the /list command
  public async action(ctx: Context) {
    const callouts = await this.callout.list();
    const res = this.calloutRenderer.listItems(callouts);
    await this.communication.reply(ctx, res);
  }
}

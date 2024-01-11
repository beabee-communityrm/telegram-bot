import { Singleton } from "alosaur/mod.ts";
import { Command } from "../core/command.ts";
import {
  CalloutService,
  CommunicationService,
  EventService,
  KeyboardService,
} from "../services/index.ts";
import { I18nService } from "../services/i18n.service.ts";
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
    protected readonly i18n: I18nService,
  ) {
    super();
    this.command = this.i18n.t("commands.list.command");
    this.description = this.i18n.t("commands.list.description");
    console.debug(`${ListCommand.name} created`);
  }

  // Handle the /list command
  public async action(ctx: Context) {
    const callouts = await this.callout.list();
    const res = this.calloutRenderer.listItems(callouts);
    await this.communication.sendAndReceiveAll(ctx, res);
  }
}

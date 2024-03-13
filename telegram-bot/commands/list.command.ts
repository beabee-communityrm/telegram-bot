import { Context, Singleton } from "../deps.ts";
import { Command } from "../core/command.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CalloutRenderer } from "../renderer/index.ts";

import { UserState } from "../types/index.ts";

@Singleton()
export class ListCommand extends Command {
  key = "list";
  /** /list */
  command = "list";
  /**
   * List active Callouts
   * (Description is set in CommandService with a translation)
   */
  description = "";

  visibleOnStates: UserState[] = ["start"];

  constructor(
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly keyboard: KeyboardService,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly i18n: I18nService,
  ) {
    super();
  }

  // Handle the /list command
  public async action(ctx: Context) {
    const callouts = await this.callout.list();
    const res = this.calloutRenderer.listItems(callouts);
    await this.communication.sendAndReceiveAll(ctx, res);
  }
}

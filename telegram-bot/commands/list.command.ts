import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/base.command.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CalloutRenderer, MessageRenderer } from "../renderer/index.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class ListCommand extends BaseCommand {
  /** /list */
  command = "list";

  visibleOnStates: ChatState[] = [ChatState.Start];

  constructor(
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly keyboard: KeyboardService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly i18n: I18nService,
  ) {
    super();
  }

  // Handle the /list command
  public async action(ctx: AppContext) {
    const session = await ctx.session;

    if (session.state === ChatState.CalloutList) {
      // TODO: send error message
      return;
    }

    // Update the state
    session.state = ChatState.CalloutList;
    const callouts = await this.callout.list();
    const render = this.calloutRenderer.listItems(callouts);
    await this.communication.sendAndReceiveAll(ctx, render);
  }
}

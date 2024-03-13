import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class CancelCommand extends BaseCommand {
  /** `/cancel` */
  command = "cancel";

  // TODO: Disable this command on production
  visibleOnStates: ChatState[] = [
    ChatState.CalloutAnswer,
    ChatState.CalloutAnswered,
    ChatState.CalloutDetails,
    ChatState.CalloutList,
  ];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly stateMachine: StateMachineService,
  ) {
    super();
  }

  // Handle the /cancel command
  async action(ctx: AppContext) {
    // Always allow this command to reset the state even if an error occurs, so we not use `this.checkAction` here
    const session = await ctx.session;
    const abortController = session._data.abortController;

    if (abortController) {
      // Already cancelled
      if (abortController.signal.aborted) {
        await this.communication.send(
          ctx,
          this.messageRenderer.cancelCancelledMessage(),
        );
      } else {
        // Successful cancellation
        await this.communication.send(
          ctx,
          this.messageRenderer.cancelSuccessfulMessage(),
        );
      }
    } else {
      // Nothing to cancel
      await this.communication.send(
        ctx,
        this.messageRenderer.cancelUnsuccessfulMessage(),
      );
    }

    return this.stateMachine.cancelSessionState(session);
  }
}

import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class ResetCommand extends BaseCommand {
  /** `/reset` */
  command = "reset";

  // TODO: Disable this command on production
  visibleOnStates: ChatState[] = [
    ChatState.Start,
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
    protected readonly keyboard: KeyboardService,
  ) {
    super();
  }
  // Handle the /reset command
  async action(ctx: AppContext) {
    // Always allow this command to reset the state even if an error occurs, so we not use `this.checkAction` here
    const session = await ctx.session;
    const abortController = session._data.abortController;

    if (abortController) {
      // Already cancelled
      if (abortController.signal.aborted) {
        await this.communication.send(
          ctx,
          this.messageRenderer.resetCancelledMessage(),
        );
      } else {
        // Successful cancellation
        await this.communication.send(
          ctx,
          this.messageRenderer.resetSuccessfulMessage(),
        );
      }
    } else {
      // Nothing to cancel
      await this.communication.send(
        ctx,
        this.messageRenderer.resetUnsuccessfulMessage(),
      );
    }

    const successful = await this.stateMachine.resetSessionState(ctx);

    // Use this after the reset to show the right help message for the current state
    await this.communication.send(
      ctx,
      await this.messageRenderer.continueHelp(session.state),
    );

    return successful;
  }
}

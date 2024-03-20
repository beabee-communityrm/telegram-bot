import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";
import { ListCommand } from "./index.ts";

import type { AppContext } from "../types/index.ts";

// Temporary constant until it is certain that we want to do this, I am not happy with it because we are no longer able to reset the state to to the `start` state
const SHOW_LIST_AFTER_RESET = true;

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
    protected readonly listCommand: ListCommand,
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

    // Show list if the constant is set to true
    if (SHOW_LIST_AFTER_RESET) {
      await this.keyboard.removeLastInlineKeyboard(ctx);

      await this.communication.send(
        ctx,
        await this.messageRenderer.continueList(),
      );

      const successful = await this.listCommand.action(ctx, true);
      return successful;
    }

    // Otherwise show continue help and set the state to start

    const successful = await this.stateMachine.resetSessionState(ctx);

    // Use this after the reset to show the right help message for the current state
    await this.communication.send(
      ctx,
      await this.messageRenderer.continueHelp(session.state),
    );

    return successful;
  }
}

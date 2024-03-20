import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";
import { ListCommand } from "./index.ts";

import type { AppContext } from "../types/index.ts";

const SHOW_LIST_AFTER_START = true;

@Singleton()
export class StartCommand extends BaseCommand {
  /** `/start` */
  command = "start";

  visibleOnStates: ChatState[] = [ChatState.Initial];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly stateMachine: StateMachineService,
    protected readonly listCommand: ListCommand,
  ) {
    super();
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: AppContext): Promise<boolean> {
    const session = await ctx.session;
    const successful = await this.checkAction(ctx);
    if (!successful) {
      return false;
    }

    await this.communication.send(ctx, this.messageRenderer.welcome());

    // Show list if the constant is set to true
    if (SHOW_LIST_AFTER_START) {
      const successful = await this.listCommand.action(ctx, true);
      return successful;
    }

    // Otherwise show initial help and set the state to start

    this.stateMachine.setSessionState(session, ChatState.Start, false);

    await this.communication.send(
      ctx,
      await this.messageRenderer.help(session.state),
    );

    return successful;
  }
}

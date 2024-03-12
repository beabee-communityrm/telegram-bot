import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class StartCommand extends BaseCommand {
  /** `/start` */
  command = "start";

  visibleOnStates: ChatState[] = [ChatState.Initial, ChatState.Start];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly stateMachine: StateMachineService,
  ) {
    super();
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: AppContext) {
    const session = await ctx.session;

    this.stateMachine.setSessionState(session, ChatState.Start, false);

    await this.communication.send(ctx, this.messageRenderer.welcome());
    await this.communication.send(
      ctx,
      this.messageRenderer.intro(session.state),
    );
  }
}

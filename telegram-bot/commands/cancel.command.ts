import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class CancelCommand extends BaseCommand {
  /** `/cancel` */
  command = "cancel";

  // TODO: Disable this command on production
  visibleOnStates: ChatState[] = [];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    super();
  }

  // Handle the /cancel command
  async action(ctx: AppContext) {
    const session = await ctx.session;

    switch (session.state) {
      case ChatState.Initial:
      case ChatState.Start:
      case ChatState.None:
        session.state = ChatState.Start;
        return await this.communication.send(
          ctx,
          this.messageRenderer.cancelMessage(false),
        );
    }

    switch (session.state) {
      case ChatState.CalloutAnswer:
        console.debug(
          "TODO: Canceling callout answer by watching state changes",
        );
        break;
      case ChatState.CalloutAnswered:
        console.debug(
          "TODO: Canceling callout answered by watching state changes",
        );
        break;
      case ChatState.CalloutDetails:
        console.debug(
          "TODO: Canceling callout details by watching state changes",
        );
        break;
      case ChatState.CalloutList:
        console.debug("TODO: Canceling callout list by watching state changes");
        break;
      default:
        throw new Error("Invalid state: " + session.state);
    }

    // Reset state
    session.state = ChatState.Start;

    return await this.communication.send(
      ctx,
      this.messageRenderer.cancelMessage(true),
    );
  }
}

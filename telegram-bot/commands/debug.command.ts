import { Singleton } from "../deps.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class DebugCommand extends BaseCommand {
  /** `/debug` */
  command = "debug";

  // TODO: Disable this command on production
  visibleOnStates: ChatState[] = [
    ChatState.CalloutAnswer,
    ChatState.CalloutAnswered,
    ChatState.CalloutDetails,
    ChatState.CalloutList,
    ChatState.Initial,
    ChatState.Start,
  ];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    super();
  }

  // Handle the /debug command
  async action(ctx: AppContext) {
    await this.communication.send(
      ctx,
      await this.messageRenderer.debug(ctx),
    );
  }
}

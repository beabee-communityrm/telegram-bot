import { Singleton } from "../deps.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";

import type { UserState, AppContext } from "../types/index.ts";

@Singleton()
export class StartCommand extends BaseCommand {
  key = "start";
  /** `/start` */
  command = "start";

  visibleOnStates: UserState[] = ["start"];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    super();
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: AppContext) {
    await this.communication.send(ctx, this.messageRenderer.welcome());
    await this.communication.send(ctx, await this.messageRenderer.intro());
    
    // Update the state of the user
    ctx.session.state = "start";
  }
}

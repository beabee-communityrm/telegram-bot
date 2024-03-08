import { Singleton } from "../deps.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class HelpCommand extends BaseCommand {
  /** `/help` */
  command = "help";

  visibleOnStates: ChatState[] = [ChatState.Initial, ChatState.Start];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    super();
  }

  // Handle the /help command
  async action(ctx: AppContext) {
    // Use session.state to get context related help
    const session = await ctx.session;

    await this.communication.send(
      ctx,
      this.messageRenderer.intro(session.state),
    );
  }
}

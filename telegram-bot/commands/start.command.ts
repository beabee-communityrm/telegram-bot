import { Context, Singleton } from "../deps.ts";
import { Command } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";

import type { UserState } from "../types/user-state.ts";

@Singleton()
export class StartCommand extends Command {
  key = "start";
  command = "start";
  /**
   * Start the bot
   * (Description is set in CommandService with a translation)
   */
  description = "";

  visibleOnStates: UserState[] = ["start"];

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    super();
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: Context) {
    await this.communication.send(ctx, this.messageRenderer.welcome());
    await this.communication.send(ctx, await this.messageRenderer.intro());
  }
}

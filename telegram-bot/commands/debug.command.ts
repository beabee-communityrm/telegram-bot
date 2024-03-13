import { Singleton } from "../deps/index.ts";
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
  visibleOnStates: ChatState[] = []; // Visible in all states

  constructor(
    protected readonly i18n: I18nService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    super();
  }

  // Handle the /debug command
  async action(ctx: AppContext) {
    const successful = await this.checkAction(ctx);
    if (!successful) {
      return false;
    }
    await this.communication.send(
      ctx,
      await this.messageRenderer.debug(ctx),
    );
    return successful;
  }
}

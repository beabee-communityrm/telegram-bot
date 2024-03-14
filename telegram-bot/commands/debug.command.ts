import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";

import type { AppContext } from "../types/index.ts";

const IS_DEV = Deno.env.get("TELEGRAM_BOT_ENVIRONMENT") === "development";

@Singleton()
export class DebugCommand extends BaseCommand {
  /** `/debug` */
  command = "debug";

  // Only visible in development
  visibleOnStates: ChatState[] = IS_DEV ? [] : [ChatState.None];

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

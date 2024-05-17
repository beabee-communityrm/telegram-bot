import { Singleton } from "../deps/index.ts";
import { BaseCommand } from "../core/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";
import { ChatState } from "../enums/index.ts";
import { ListCommand, ResetCommand, ShowCommand } from "./index.ts";
import { START_CALLOUT_PREFIX } from "../constants/index.ts";

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
    protected readonly resetCommand: ResetCommand,
    protected readonly showCommand: ShowCommand,
  ) {
    super();
  }

  // Handle the /start command, replay with markdown formatted text: https://grammy.dev/guide/basics#sending-message-with-formatting
  async action(ctx: AppContext): Promise<boolean> {
    const session = await ctx.session;

    try {
      const payload = ctx.match;

      // If the payload is a callout slug, show the callout
      // We check if the payload starts with "c_" to indicate that the payload is a callout slug
      if (
        typeof payload === "string" && payload.startsWith(START_CALLOUT_PREFIX)
      ) {
        const slug = payload.substring(START_CALLOUT_PREFIX.length);
        return await this.showCommand.action(ctx, slug);
      }

      // Always allow the start command, automatically reset the session if it is not on the initial state
      const startAlreadyUsed = await this.checkAction(ctx, true);
      if (!startAlreadyUsed) {
        // Send the welcome message before the reset command
        await this.communication.send(ctx, this.messageRenderer.welcome());
        // Execute the reset command
        return await this.resetCommand.action(ctx);
      }

      await this.communication.send(ctx, this.messageRenderer.welcome());

      // Show list if the constant is set to true
      if (SHOW_LIST_AFTER_START) {
        const successful = await this.listCommand.action(ctx, true);
        return successful;
      }

      // Otherwise show initial help and set the state to start

      await this.stateMachine.setSessionState(ctx, ChatState.Start, false);

      await this.communication.send(
        ctx,
        this.messageRenderer.help(session.state),
      );
    } catch (error) {
      console.error(error);
      return false;
    }

    return true;
  }
}

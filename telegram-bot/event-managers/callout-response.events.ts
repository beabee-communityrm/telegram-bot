import { Singleton } from "../deps/index.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { EventService } from "../services/event.service.ts";
import { BotService } from "../services/bot.service.ts";
import { TransformService } from "../services/transform.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import {
  CalloutRenderer,
  CalloutResponseRenderer,
  MessageRenderer,
} from "../renderer/index.ts";
import { ResetCommand } from "../commands/reset.command.ts";
import { ListCommand } from "../commands/list.command.ts";
import { ChatState } from "../enums/index.ts";
import {
  FALSY_MESSAGE_KEY,
  INLINE_BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
  INLINE_BUTTON_CALLBACK_PREFIX,
  TRUTHY_MESSAGE_KEY,
} from "../constants/index.ts";
import { BaseEventManager } from "../core/base.events.ts";

import type { AppContext } from "../types/index.ts";

const SHOW_LIST_AFTER_DONE = false;
const ASK_SHOW_LIST_AFTER_DONE = true;

@Singleton()
export class CalloutResponseEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly bot: BotService,
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutRenderer: CalloutRenderer,
    protected readonly calloutResponseRenderer: CalloutResponseRenderer,
    protected readonly transform: TransformService,
    protected readonly keyboard: KeyboardService,
    protected readonly stateMachine: StateMachineService,
    protected readonly resetCommand: ResetCommand,
    protected readonly listCommand: ListCommand,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    this.event.on(
      `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_CALLOUT_PARTICIPATE}`,
      (event) => {
        this.onCalloutParticipateKeyboardPressed(event);
      },
    );
  }

  protected async onCalloutParticipateKeyboardPressed(ctx: AppContext) {
    const data = ctx.callbackQuery?.data?.split(":");
    // const slug = data?.[1];
    const shortSlug = data?.[1];
    // const startResponse = data?.[2] as "continue" | "cancel" === "continue";
    const startResponse =
      data?.[2] as typeof TRUTHY_MESSAGE_KEY | typeof FALSY_MESSAGE_KEY ===
        TRUTHY_MESSAGE_KEY; // This is the key, so it's not localized
    const session = await ctx.session;

    await this.keyboard.removeInlineKeyboard(ctx);

    if (!startResponse) {
      await this.communication.send(ctx, this.messageRenderer.stop());

      // remove loading animation
      await this.communication.answerCallbackQuery(ctx);
      return;
    }

    if (!shortSlug) {
      await this.communication.send(
        ctx,
        this.messageRenderer.calloutNotFound(),
      );
      return;
    }

    const slug = this.callout.getSlug(shortSlug);

    if (!slug) {
      await this.communication.send(
        ctx,
        this.messageRenderer.calloutNotFound(),
      );
      return;
    }

    console.debug(
      "onCalloutParticipateKeyboardPressed",
      data,
      slug,
      // startResponse,
    );

    const calloutWithForm = await this.callout.get(slug, ["form"]);

    // Render the callout with the form
    const questions = this.calloutResponseRenderer
      .full(calloutWithForm);

    // remove loading animation
    await this.communication.answerCallbackQuery(
      ctx,
    );

    const abortSignal = await this.stateMachine.setSessionState(
      ctx,
      ChatState.CalloutAnswer,
      true,
    );

    if (!abortSignal) {
      throw new Error("The AbortSignal is required!");
    }

    // Wait for all responses
    const responses = await this.communication.sendAndReceiveAll(
      ctx,
      questions,
      abortSignal,
    );

    if (responses instanceof AbortSignal) {
      return;
    }

    const answers = this.transform.parseCalloutFormResponses(responses);

    console.debug(
      "Got answers",
      answers,
    );

    try {
      // TODO: Ask for contact details if callout requires it
      await this.callout.createResponse(slug, {
        answers,
        //guestName: ctx.from?.username,
        // guestEmail: "test@beabee.io",
      });
    } catch (error) {
      console.error(
        `Failed to create response`,
        error,
      );

      // TODO: Send error message to the chat?
    }

    // TODO: Send success message and a summary of answers to the chat

    // Show the list of callouts
    if (SHOW_LIST_AFTER_DONE) {
      await this.communication.send(
        ctx,
        await this.messageRenderer.continueList(),
      );

      return await this.listCommand.action(ctx, true);
    }

    // Ask if the user wants to see the list of callouts
    if (ASK_SHOW_LIST_AFTER_DONE) {
      await this.communication.send(
        ctx,
        await this.calloutRenderer.listCalloutsKeyboard(),
      );
      return;
    }

    // Show help
    try {
      await this.stateMachine.setSessionState(
        ctx,
        ChatState.CalloutAnswered,
        false,
      );

      await this.communication.send(
        ctx,
        await this.messageRenderer.continueHelp(session.state),
      );
    } catch (error) {
      console.error(error);
    }
  }
}

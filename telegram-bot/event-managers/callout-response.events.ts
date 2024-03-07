import { Context, Singleton } from "../deps.ts";
import { CalloutService } from "../services/callout.service.ts";
import { CommunicationService } from "../services/communication.service.ts";
import { EventService } from "../services/event.service.ts";
import { TransformService } from "../services/transform.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { CalloutResponseRenderer, MessageRenderer } from "../renderer/index.ts";
import {
  BUTTON_CALLBACK_CALLOUT_INTRO,
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
} from "../constants/index.ts";
import { BaseEventManager } from "../core/base.events.ts";

@Singleton()
export class CalloutResponseEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly callout: CalloutService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutResponseRenderer: CalloutResponseRenderer,
    protected readonly transform: TransformService,
    protected readonly keyboard: KeyboardService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    // Listen for the callback query data event with the `callout-respond:yes` data
    this.event.on(
      `callback_query:data:${BUTTON_CALLBACK_CALLOUT_INTRO}`,
      (event) => {
        this.onCalloutIntroKeyboardPressed(event);
      },
    );

    this.event.on(
      `callback_query:data:${BUTTON_CALLBACK_CALLOUT_PARTICIPATE}`,
      (event) => {
        this.onCalloutParticipateKeyboardPressed(event);
      },
    );
  }

  protected async onCalloutParticipateKeyboardPressed(ctx: Context) {
    const data = ctx.callbackQuery?.data?.split(":");
    const slug = data?.[1];
    const startResponse = data?.[2] as "continue" | "cancel" === "continue";

    // Remove the inline keyboard
    await this.keyboard.removeInlineKeyboard(ctx);

    if (!startResponse) {
      await this.communication.send(ctx, this.messageRenderer.stop());

      // remove loading animation
      await this.communication.answerCallbackQuery(ctx);
      return;
    }

    if (!slug) {
      await this.communication.send(
        ctx,
        this.messageRenderer.calloutNotFound(),
      );

      // remove loading animation
      await this.communication.answerCallbackQuery(ctx);
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
      "Disabled inline keyboard",
    );

    const responses = await this.communication.sendAndReceiveAll(
      ctx,
      questions,
    );

    const answers = this.transform.parseCalloutFormResponses(responses);

    // TODO: Show summary of answers here

    console.debug(
      "Got answers",
      answers,
    );

    try {
      const response = await this.callout.createResponse(slug, {
        answers,
        guestName: ctx.from?.username,
        // guestEmail: "test@beabee.io",
      });

      console.debug(
        "Created response",
        response,
      );
    } catch (error) {
      console.error(
        `Failed to create response`,
        error,
      );
    }
  }

  /**
   * Handle the callback query data event with the `callout-respond:yes` or `callout-respond:no` data.
   * Called when the user presses the "Yes" or "No" button on the callout response keyboard.
   * @param ctx
   */
  protected async onCalloutIntroKeyboardPressed(ctx: Context) {
    const data = ctx.callbackQuery?.data?.split(":");
    const shortSlug = data?.[1];
    const startIntro = data?.[2] as "yes" | "no" === "yes"; // This is the key, so it's not localized

    // Remove the inline keyboard
    await this.keyboard.removeInlineKeyboard(ctx);

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

    if (!startIntro) {
      await this.communication.send(ctx, this.messageRenderer.stop());
      return;
    }

    // Start intro
    const calloutWithForm = await this.callout.get(slug, ["form"]);

    const res = this.calloutResponseRenderer.intro(calloutWithForm);
    await this.communication.send(ctx, res);
  }
}

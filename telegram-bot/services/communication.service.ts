import { BaseService } from "../core/index.ts";
import {
  fmt,
  ForceReply,
  InlineKeyboardMarkup,
  Message,
  ParseModeFlavor,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Singleton,
} from "../deps/index.ts";
import { ParsedResponseType, RenderType, ReplayType } from "../enums/index.ts";

import { EventService } from "./event.service.ts";
import { KeyboardService } from "./keyboard.service.ts";
import { TransformService } from "./transform.service.ts";
import { ConditionService } from "./condition.service.ts";
import { ValidationService } from "./validation.service.ts";
import { I18nService } from "../services/i18n.service.ts";

import {
  getIdentifier,
  getSelectionLabelNumberRange,
  sleep,
} from "../utils/index.ts";
import { CalloutResponseRenderer, MessageRenderer } from "../renderer/index.ts";
import {
  CHECKMARK,
  INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE,
  INLINE_BUTTON_CALLBACK_PREFIX,
} from "../constants/index.ts";

import type {
  AppContext,
  Render,
  RenderResponse,
  RenderResponseParsed,
  ReplayAccepted,
} from "../types/index.ts";

/**
 * Service to handle the communication with the telegram bot and the telegram user.
 * This service waits for a response until a response is received that fulfils a basic condition (if there is a condition).
 */
@Singleton()
export class CommunicationService extends BaseService {
  constructor(
    protected readonly event: EventService,
    protected readonly keyboard: KeyboardService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly calloutResponseRenderer: CalloutResponseRenderer,
    protected readonly transform: TransformService,
    protected readonly condition: ConditionService,
    protected readonly validation: ValidationService,
    protected readonly i18n: I18nService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Reply to a Telegram message or action with a single render object
   *
   * @param ctx
   * @param render
   */
  public async send(ctx: AppContext, render: Render) {
    if (render.keyboard && render.inlineKeyboard) {
      throw new Error("You can only use one keyboard at a time");
    }

    if (render.beforeDelay) {
      await sleep(render.beforeDelay);
    }

    // link previews are disabled by default, define render.linkPreview to enable them
    if (!render.linkPreview) {
      render.linkPreview = {
        is_disabled: true,
      };
    }

    let markup:
      | InlineKeyboardMarkup
      | ReplyKeyboardMarkup
      | ReplyKeyboardRemove
      | ForceReply
      | undefined = render.keyboard || render.inlineKeyboard || undefined;

    if (!markup && render.removeCustomKeyboard) {
      markup = { remove_keyboard: true } as ReplyKeyboardRemove;
    }

    if (!markup && render.forceReply) {
      markup = { force_reply: true } as ForceReply;
    }

    let message: Message | undefined;

    switch (render.type) {
      case RenderType.PHOTO:
        message = (await ctx.replyWithMediaGroup([render.photo], {}))[0];
        if (render.keyboard) {
          message = await ctx.reply("", {
            link_preview_options: render.linkPreview,
            reply_markup: markup,
          });
        }
        break;
      case RenderType.MARKDOWN:
        message = await ctx.reply(render.markdown, {
          parse_mode: "MarkdownV2",
          link_preview_options: render.linkPreview,
          reply_markup: markup,
        });
        break;
      case RenderType.HTML:
        message = await ctx.reply(render.html, {
          parse_mode: "HTML",
          link_preview_options: render.linkPreview,
          reply_markup: markup,
        });
        break;
      case RenderType.TEXT:
        message = await ctx.reply(render.text, {
          link_preview_options: render.linkPreview,
          reply_markup: markup,
        });
        break;
      // See https://grammy.dev/plugins/parse-mode
      case RenderType.FORMAT:
        message = await (ctx as ParseModeFlavor<AppContext>).replyFmt(
          fmt(render.format),
          {
            link_preview_options: render.linkPreview,
            reply_markup: markup,
          },
        );
        break;
      case RenderType.EMPTY:
        // Do nothing
        break;
      default:
        throw new Error("Unknown render type: " + (render as Render).type);
    }

    if (message && markup) {
      await this.keyboard.storeLatestInSession(ctx, markup, message);
    }

    if (render.afterDelay) {
      await sleep(render.afterDelay);
    }

    return message;
  }

  /**
   * Edit a Telegram message or action with a single render object
   *
   * @param ctx
   * @param render
   */
  public async edit(
    ctx: AppContext,
    oldMessage: { message_id: number; chat: { id: number } },
    render: Render,
  ) {
    const message = ctx.message;
    if (render.keyboard && render.inlineKeyboard) {
      throw new Error("You can only use one keyboard at a time");
    }

    if (render.beforeDelay) {
      await sleep(render.beforeDelay);
    }

    // link previews are disabled by default, define render.linkPreview to enable them
    if (!render.linkPreview) {
      render.linkPreview = {
        is_disabled: true,
      };
    }

    if (render.keyboard) {
      console.warn("Edit message with custom keyboard not implemented");
    }

    if (render.removeCustomKeyboard) {
      console.warn("Remove custom keyboard not implemented on edit");
    }

    if (render.forceReply) {
      console.warn("Force reply not implemented on edit");
    }

    const markup:
      | InlineKeyboardMarkup
      | undefined = render.inlineKeyboard || undefined;

    switch (render.type) {
      case RenderType.PHOTO:
        throw new Error("Edit media not implemented");
      case RenderType.MARKDOWN:
        await ctx.api.editMessageText(
          oldMessage.chat.id,
          oldMessage.message_id,
          render.markdown,
          {
            parse_mode: "MarkdownV2",
            link_preview_options: render.linkPreview,
            reply_markup: markup,
          },
        );
        break;
      case RenderType.HTML:
        await ctx.api.editMessageText(
          oldMessage.chat.id,
          oldMessage.message_id,
          render.html,
          {
            parse_mode: "HTML",
            link_preview_options: render.linkPreview,
            reply_markup: markup,
          },
        );
        break;
      case RenderType.TEXT:
        await ctx.api.editMessageText(
          oldMessage.chat.id,
          oldMessage.message_id,
          render.text,
          {
            link_preview_options: render.linkPreview,
            reply_markup: markup,
          },
        );
        break;
      // See https://grammy.dev/plugins/parse-mode
      case RenderType.FORMAT:
        throw new Error("Edit format not implemented on edit");
      case RenderType.EMPTY:
        // Do nothing
        break;
      default:
        throw new Error("Unknown render type: " + (render as Render).type);
    }

    if (message && markup) {
      await this.keyboard.storeLatestInSession(ctx, markup, message);
    }

    if (render.afterDelay) {
      await sleep(render.afterDelay);
    }

    return message;
  }

  /**
   * Wait for any message to be received.
   * TODO: Store event to be able to unsubscribe all unused events if the user stops the conversation or presses a button to answer instead
   * @param ctx
   * @returns
   */
  public async receiveMessageOrCallbackQueryData(
    ctx: AppContext,
    signal: AbortSignal | null,
  ) {
    const userId = getIdentifier(ctx);
    const eventName =
      `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE}`;

    return await new Promise<AppContext>((resolve) => {
      const onMessage = (ctx: AppContext) => {
        this.event.offUser(eventName, userId, onInteractionCallbackQueryData);
        signal?.removeEventListener("abort", onAbort);
        resolve(ctx);
      };

      // TODO: Any elegant way to move this to the CalloutResponseEventManager?
      const onInteractionCallbackQueryData = (ctx: AppContext) => {
        this.event.offUserMessage(userId, onMessage);
        signal?.removeEventListener("abort", onAbort);
        resolve(ctx);
      };

      const onAbort = () => {
        this.event.offUser(eventName, userId, onInteractionCallbackQueryData);
        this.event.offUserMessage(userId, onMessage);
      };

      signal?.addEventListener("abort", onAbort, { once: true });
      this.event.onceUserMessage(userId, onMessage);
      this.event.onceUser(eventName, userId, onInteractionCallbackQueryData);
    });
  }

  /**
   * Render or update accepted answers to give the user feedback, also renders updates the inline keyboard
   * @param ctx
   * @param render
   * @param replays
   * @param lastGivenAnswerMessage
   */
  protected async sendOrEditAnswersGivenAndKeyboard(
    ctx: AppContext,
    render: Render,
    replays: ReplayAccepted[],
    lastGivenAnswerMessage: Message | undefined,
  ) {
    const renderAnswers = this.calloutResponseRenderer.answersGiven(
      replays,
      render.accepted.multiple,
    );

    let inlineKeyboard = renderAnswers.inlineKeyboard || render.inlineKeyboard;

    if (render.accepted.multiple) {
      if (inlineKeyboard) {
        // Remove skip button
        renderAnswers.inlineKeyboard = this.keyboard.removeInlineButton(
          inlineKeyboard,
          `${INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE}:skip`,
        );
        inlineKeyboard = renderAnswers.inlineKeyboard;

        // Add done button
        renderAnswers.inlineKeyboard = this.keyboard.addInlineButton(
          inlineKeyboard,
          this.keyboard.inlineDoneButton(),
        );
        inlineKeyboard = renderAnswers.inlineKeyboard;

        // Remove already selected answers from keyboard
        if (render.accepted.type === ReplayType.SELECTION) {
          const numberLabels = getSelectionLabelNumberRange(
            render.accepted.valueLabel,
          );
          for (const numberLabel of numberLabels) {
            const cbQueryData =
              `${INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE}:${numberLabel}`;
            const alreadyUsed = replays.find((replay) =>
              replay.context.callbackQuery?.data === cbQueryData
            );
            if (alreadyUsed) {
              renderAnswers.inlineKeyboard = this.keyboard.renameInlineButton(
                inlineKeyboard,
                cbQueryData,
                numberLabel + " " + CHECKMARK,
              );
              inlineKeyboard = renderAnswers.inlineKeyboard;
            } else {
              renderAnswers.inlineKeyboard = this.keyboard.renameInlineButton(
                inlineKeyboard,
                cbQueryData,
                numberLabel,
              );
              inlineKeyboard = renderAnswers.inlineKeyboard;
            }
          }
        }
      }
    }

    if (lastGivenAnswerMessage) {
      this.edit(
        ctx,
        lastGivenAnswerMessage,
        renderAnswers,
      );
    } else {
      lastGivenAnswerMessage = await this.send(
        ctx,
        renderAnswers,
      );
    }

    return lastGivenAnswerMessage;
  }

  protected equalReplayAnswer(
    replay1: ReplayAccepted,
    replay2: ReplayAccepted,
  ) {
    // If the replay is the same reference, return true
    if (replay1 === replay2) {
      return true;
    }

    if (replay1.type !== replay2.type) {
      return false;
    }

    if (replay1.isDoneMessage !== replay2.isDoneMessage) {
      return false;
    }

    if (replay1.isSkipMessage !== replay2.isSkipMessage) {
      return false;
    }

    switch (replay1.type) {
      case ReplayType.NONE:
        return true;
      case ReplayType.TEXT:
        return replay1.text === (replay2 as typeof replay1).text;
      case ReplayType.SELECTION:
        return replay1.value === (replay2 as typeof replay1).value;
      case ReplayType.FILE:
        return replay1.fileId === (replay2 as typeof replay1).fileId;
      case ReplayType.CALLOUT_COMPONENT_SCHEMA:
        return replay1.answer === (replay2 as typeof replay1).answer;
    }

    console.warn("Unknown replay type", replay1.type);
    return false;
  }

  /**
   * Wait for a specific message to be received and collect all messages of type `render.accepted` until the specific message is received.
   * @param ctx
   * @param render
   * @returns
   */
  protected async acceptedUntilSpecificMessage(
    ctx: AppContext,
    render: Render,
    signal: AbortSignal | null,
  ) {
    let context: AppContext;
    let message: Message | undefined;
    let callbackQueryData: string | undefined;
    let lastGivenAnswerMessage: Message | undefined;
    let replays: ReplayAccepted[] = [];

    if (render.accepted.type === ReplayType.NONE) {
      return [];
    }

    let replayAccepted: ReplayAccepted | undefined;

    do {
      if (signal?.aborted) {
        return replays;
      }

      context = await this.receiveMessageOrCallbackQueryData(ctx, signal);
      message = context.message;
      callbackQueryData = context.callbackQuery?.data;

      // Answer send using a inline keyboard button
      if (callbackQueryData) {
        replayAccepted = this.validation.callbackQueryDataIsAccepted(
          context,
          render.accepted,
        );
        await this.answerCallbackQuery(context);
      } // Answer send using a message
      else if (message) {
        replayAccepted = this.validation.messageIsAccepted(
          context,
          render.accepted,
        );
      } else {
        throw new Error("Message and callback query data are undefined");
      }

      if (!replayAccepted.accepted) {
        await this.send(
          ctx,
          this.messageRenderer.notAcceptedMessage(
            replayAccepted,
            render.accepted,
          ),
        );
        continue;
      }

      await this.keyboard.removeInlineKeyboard(context);
      await this.keyboard.removeLastInlineKeyboard(context);

      if (replayAccepted.isDoneMessage) {
        // Return what we have
        return replays;
      }

      if (replayAccepted.isSkipMessage) {
        // Only return the skip message (handled later)
        return [replayAccepted];
      }

      const replayAlreadyTaken = replays.find((replay) =>
        this.equalReplayAnswer(replay, replayAccepted as ReplayAccepted)
      );

      // If answewr is a selection and it is already in the replays, remove it
      if (replayAccepted.type === ReplayType.SELECTION && replayAlreadyTaken) {
        replays = replays.filter((replay) => replay !== replayAlreadyTaken);
      } else {
        // Answer accepted
        replays.push(replayAccepted);
      }

      // Send or edit given answers message
      lastGivenAnswerMessage = await this.sendOrEditAnswersGivenAndKeyboard(
        context,
        render,
        replays,
        lastGivenAnswerMessage,
      );

      if (!render.accepted.multiple) {
        return replays;
      }
    } while (!replayAccepted?.isDoneMessage && !replayAccepted?.isSkipMessage);

    return replays;
  }

  /**
   * Wait for a specific message or file to be received and collect all messages of type `acceptedBefore` until the specific message is received
   * @param ctx
   * @param acceptedUntil
   * @returns
   */
  public async receive(
    ctx: AppContext,
    render: Render,
    signal: AbortSignal | null,
  ): Promise<RenderResponseParsed<boolean>> {
    // Do not wait for any specific message
    if (!render.accepted || render.accepted.type === ReplayType.NONE) {
      return {
        type: ParsedResponseType.NONE,
        multiple: false,
        replay: null,
        data: null,
      };
    }

    // Receive all messages of specific type until a message of specific type is received
    const replays = await this.acceptedUntilSpecificMessage(
      ctx,
      render,
      signal,
    );

    // Parse multiple messages
    if (render.accepted.multiple) {
      const res: RenderResponseParsed<true> = {
        type: render.parseType,
        multiple: true,
        replay: replays,
        data: this.transform.parseResponses(replays, render),
      } as RenderResponseParsed<true>;

      return res;
    }

    // Parse single message
    const res: RenderResponseParsed<false> = {
      type: render.parseType,
      multiple: false,
      replay: replays[0],
      data: this.transform.parseResponse(replays[0], render),
    } as RenderResponseParsed<false>;

    return res;
  }

  /**
   * Send a render result and wait for a message response until a specific message or file is received.
   * @param ctx
   * @param render
   * @returns
   */
  public async sendAndReceive(
    ctx: AppContext,
    render: Render,
    signal: AbortSignal | null,
  ) {
    await this.send(ctx, render);

    const responses = await this.receive(ctx, render, signal);
    const response: RenderResponse = {
      render,
      responses,
    };
    return response;
  }

  /**
   * Send multiple render results and wait for a message response until a specific message or file is received if `acceptedUntil` is defined.
   * @param ctx
   * @param renders
   */
  public async sendAndReceiveAll(
    ctx: AppContext,
    renders: Render[],
    signal: AbortSignal | null,
  ) {
    const responses: RenderResponse[] = [];
    for (const render of renders) {
      if (signal?.aborted) {
        return signal;
      }
      try {
        const response = await this.sendAndReceive(ctx, render, signal);
        if (response) {
          responses.push(response);
        }
      } catch (error) {
        console.error("Failed to send and receive", error, render);
        throw error;
      }
    }
    return responses;
  }

  /**
   * Context-aware alias for `api.answerCallbackQuery`. Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned.
   *
   * Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @BotFather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
   *
   * @param other Optional remaining parameters, confer the official reference below
   * @param signal Optional `AbortSignal` to cancel the request
   *
   * **Official reference:** https://core.telegram.org/bots/api#answercallbackquery
   */
  public async answerCallbackQuery(ctx: AppContext, text?: string) {
    try {
      await ctx.answerCallbackQuery({
        text,
      });
    } catch (error) {
      console.warn(
        "Failed to answer callback query",
        error,
      );
    }
  }
}

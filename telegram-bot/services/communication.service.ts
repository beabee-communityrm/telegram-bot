import { BaseService } from "../core/index.ts";
import {
  Context,
  fmt,
  Message,
  ParseModeFlavor,
  Singleton,
} from "../deps/index.ts";
import { ParsedResponseType, RenderType, ReplayType } from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { TransformService } from "./transform.service.ts";
import { ConditionService } from "./condition.service.ts";
import { ValidationService } from "./validation.service.ts";
import { getIdentifier } from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";

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
    protected readonly messageRenderer: MessageRenderer,
    protected readonly transform: TransformService,
    protected readonly condition: ConditionService,
    protected readonly validation: ValidationService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Reply to a Telegram message or action with a single render object
   *
   * @todo: Make use of https://grammy.dev/plugins/parse-mode
   *
   * @param ctx
   * @param res
   */
  public async send(ctx: AppContext, render: Render) {
    switch (render.type) {
      case RenderType.PHOTO:
        await ctx.replyWithMediaGroup([render.photo]);
        if (render.keyboard) {
          await ctx.reply("", {
            reply_markup: render.keyboard,
          });
        }
        break;
      case RenderType.MARKDOWN:
        await ctx.reply(render.markdown, {
          parse_mode: "MarkdownV2",
          reply_markup: render.keyboard,
        });
        break;
      case RenderType.HTML:
        await ctx.reply(render.html, {
          parse_mode: "HTML",
          reply_markup: render.keyboard,
        });
        break;
      case RenderType.TEXT:
        await ctx.reply(render.text, {
          reply_markup: render.keyboard,
        });
        break;
      // See https://grammy.dev/plugins/parse-mode
      case RenderType.FORMAT:
        await (ctx as ParseModeFlavor<Context>).replyFmt(fmt(render.format), {
          reply_markup: render.keyboard,
        });
        break;
      case RenderType.EMPTY:
        // Do nothing
        break;
      default:
        throw new Error("Unknown render type: " + (render as Render).type);
    }
  }

  /**
   * Wait for any message to be received.
   * TODO: Store event to be able to unsubscribe all unused events if the user stops the conversation or presses a button to answer instead
   * @param ctx
   * @returns
   */
  public async receiveMessage(ctx: AppContext) {
    const data = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    return data;
  }

  /**
   * Wait for a specific message to be received and collect all messages of type `acceptedBefore` until the specific message is received.
   * @param ctx
   * @param render
   * @returns
   */
  protected async acceptedUntilSpecificMessage(
    ctx: AppContext,
    render: Render,
  ) {
    let context: Context;
    let message: Message | undefined;
    const replays: ReplayAccepted[] = [];

    if (render.accepted.type === ReplayType.NONE) {
      return [];
    }

    let replayAccepted: ReplayAccepted | undefined;

    do {
      context = await this.receiveMessage(ctx);
      message = context.message;

      if (!message) {
        console.warn("Message is undefined");
        continue;
      }

      replayAccepted = this.validation.messageIsAccepted(
        context,
        render.accepted,
      );

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

      if (render.accepted.multiple) {
        // Do not store the done message
        if (!replayAccepted.isDone) {
          replays.push(replayAccepted);
        }
      } else {
        replays.push(replayAccepted);
        // Stop collecting messages if only one message is accepted
        replayAccepted.isDone = true;
      }
    } while (!replayAccepted?.isDone);

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
  ): Promise<RenderResponseParsed<boolean>> {
    // Do not wait for a specific message
    if (!render.accepted || render.accepted.type === ReplayType.NONE) {
      return {
        type: ParsedResponseType.NONE,
        multiple: false,
        replay: null,
        data: null,
      };
    }

    // Receive all messages of specific type until a message of specific type is received
    const replays = await this.acceptedUntilSpecificMessage(ctx, render);

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
  public async sendAndReceive(ctx: AppContext, render: Render) {
    await this.send(ctx, render);

    const responses = await this.receive(ctx, render);
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
  public async sendAndReceiveAll(ctx: AppContext, renders: Render[]) {
    const responses: RenderResponse[] = [];
    for (const render of renders) {
      const response = await this.sendAndReceive(ctx, render);
      if (response) {
        responses.push(response);
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

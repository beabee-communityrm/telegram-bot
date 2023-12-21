import { Singleton } from "alosaur/mod.ts";
import { ParsedResponseType, RenderType, ReplayType } from "../enums/index.ts";
import { EventService } from "./event.service.ts";
import { TransformService } from "./transform.service.ts";
import { ConditionService } from "./condition.service.ts";
import { getIdentifier } from "../utils/index.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";

import type {
  Message,
  Render,
  RenderResponse,
  RenderResponseParsed,
  ReplayAccepted,
} from "../types/index.ts";
import type { Context } from "grammy/context.ts";

/**
 * Service to handle the communication with the telegram bot and the telegram user.
 */
@Singleton()
export class CommunicationService {
  constructor(
    protected readonly event: EventService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly transform: TransformService,
    protected readonly condition: ConditionService,
  ) {
    console.debug(`${CommunicationService.name} created`);
  }

  /**
   * Reply to a Telegram message or action with a single render result
   * @param ctx
   * @param res
   */
  public async send(ctx: Context, res: Render) {
    if (res.type === RenderType.PHOTO) {
      await ctx.replyWithMediaGroup([res.photo]);
      if (res.keyboard) {
        await ctx.reply("Please select an option", {
          reply_markup: res.keyboard,
        });
      }
    } else if (res.type === RenderType.MARKDOWN) {
      await ctx.reply(res.markdown, {
        parse_mode: "MarkdownV2",
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderType.HTML) {
      await ctx.reply(res.html, {
        parse_mode: "HTML",
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderType.TEXT) {
      await ctx.reply(res.text, {
        reply_markup: res.keyboard,
      });
    } else if (res.type === RenderType.EMPTY) {
      // Do nothing
    } else {
      throw new Error("Unknown render type: " + (res as Render).type);
    }
  }

  /**
   * Wait for any message to be received.
   * TODO: Store event to be able to unsubscribe all unused events if the user stops the conversation or presses a button to answer instead
   * @param ctx
   * @returns
   */
  public async receiveMessage(ctx: Context) {
    const event = await this.event.onceUserMessageAsync(getIdentifier(ctx));
    return event.detail;
  }

  /**
   * Wait for a specific message to be received and collect all messages of type `acceptedBefore` until the specific message is received.
   * @param ctx
   * @param render
   * @returns
   */
  protected async acceptedUntilSpecificMessage(
    ctx: Context,
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

      replayAccepted = this.condition.messageIsAccepted(
        render.accepted,
        context,
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
    ctx: Context,
    render: Render,
  ): Promise<RenderResponseParsed<boolean>> {
    // Do not wait for a specific message
    if (
      !render.accepted || render.accepted.type === ReplayType.NONE
    ) {
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
  public async sendAndReceive(ctx: Context, render: Render) {
    await this.send(ctx, render);

    const responses = await this.receive(
      ctx,
      render,
    );
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
    ctx: Context,
    renders: Render[],
  ) {
    const responses: RenderResponse[] = [];
    for (const render of renders) {
      const response = await this.sendAndReceive(ctx, render);
      if (response) {
        responses.push(response);
      }
    }
    return responses;
  }
}

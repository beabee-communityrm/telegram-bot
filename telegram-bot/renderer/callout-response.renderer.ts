import { Singleton } from "alosaur/mod.ts";
import { escapeMd, sanitizeHtml } from "../utils/index.ts";
import { RenderResultType } from "../enums/index.ts";
import {
  EventService,
  KeyboardService,
  RenderService,
} from "../services/index.ts";
import { BUTTON_CALLBACK_CALLOUT_PARTICIPATE } from "../constants.ts";

import type {
  CalloutComponentSchema,
  CalloutSlideSchema,
  Context,
  GetCalloutDataWithExt,
  InputCalloutComponentSchema,
  Message,
  RenderResult,
} from "../types/index.ts";

/**
 * Render callout responses for Telegram in Markdown
 */
@Singleton()
export class CalloutResponseRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
    protected readonly event: EventService,
    protected readonly render: RenderService,
  ) {
    console.debug(`${CalloutResponseRenderer.name} created`);
  }

  public intro(callout: GetCalloutDataWithExt<"form">) {
    const result: RenderResult = {
      type: RenderResultType.HTML,
      html: "",
    };
    result.html = `${sanitizeHtml(callout.intro)}`;

    const continueKeyboard = this.keyboard.continueCancel(
      `${BUTTON_CALLBACK_CALLOUT_PARTICIPATE}:${callout.slug}`,
    );
    result.keyboard = continueKeyboard;

    return result;
  }

  protected inputComponent(input: InputCalloutComponentSchema) {
    const label = input.label || "Empty input label";
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: `*${escapeMd(label)}*`,
    };

    switch (input.type) {
      case "address": {
        result.markdown = `_${escapeMd("\n\nPlease enter an address.")}_`;
        break;
      }
      case "button": {
        result.markdown = `_${
          escapeMd("\n\nbutton input component not implemented")
        }_`;
        break;
      }
      case "checkbox": {
        result.markdown = `_${
          escapeMd("\n\ncheckbox input component not implemented")
        }_`;
        break;
      }
      case "email": {
        result.markdown = `_${escapeMd("\n\nPlease enter an email.")}_`;
        break;
      }
      case "file": {
        result.markdown = `_${
          escapeMd(
            "\n\nPlease upload the file here or go to the file, click on Share, select Telegram, and choose me.",
          )
        }_`;
        break;
      }
      case "number": {
        result.markdown = `_${
          escapeMd(
            "\n\nYou will be asked for a number here, please do not enter any other characters.",
          )
        }_`;
        break;
      }
      case "password": {
        result.markdown = `_${
          escapeMd(
            "\n\nYou should enter a password here, and it's best to delete your response after sending it so the password doesn't remain in the history.",
          )
        }_`;
        break;
      }
      case "textfield": {
        result.markdown = `_${
          escapeMd(
            "\n\nPlease keep it brief and try to answer in one sentence.",
          )
        }_`;
        break;
      }
      case "textarea": {
        result.markdown += `_${
          escapeMd(
            "\n\nYou may answer in multiple lines, but please only send the response when you have finished writing.",
          )
        }_`;
        break;
      }
      default: {
        result.markdown += `\nUnknown input component type ${
          (input as InputCalloutComponentSchema).type || "undefined"
        }`;
        break;
      }
    }

    if (input.placeholder) {
      result.markdown += `\n\n_${
        escapeMd(`Please respond with something like "${input.placeholder}".`)
      }_`;
    }

    return result;
  }

  public component(component: CalloutComponentSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };

    switch (component.type) {
      case "address":
      case "button":
      case "checkbox":
      case "email":
      case "file":
      case "number":
      case "password":
      case "textfield":
      case "textarea": {
        result.markdown = this.inputComponent(component).markdown;
        break;
      }

      case "panel": {
        result.markdown = `panel component not implemented`;
        break;
      }
      case "radio": {
        result.markdown = `radio component not implemented`;
        break;
      }
      case "select": {
        result.markdown = `select component not implemented`;
        break;
      }
      case "selectboxes": {
        result.markdown = `selectboxes component not implemented`;
        break;
      }
      case "tabs": {
        result.markdown = `tabs component not implemented`;
        break;
      }
      case "well": {
        result.markdown = `well component not implemented`;
        break;
      }
      default: {
        result.markdown = `Unknown component type ${
          (component as CalloutComponentSchema).type || "undefined"
        }`;
        break;
      }
    }

    return result;
  }

  public async componentAndWaitForMessage(
    ctx: Context,
    component: CalloutComponentSchema,
  ) {
    const answer = await this.render.replayAndWaitForMessage(
      ctx,
      this.component(component),
    );

    if (!answer.message) {
      throw new Error("No message returned");
    }

    return answer.message;
  }

  /**
   * Render a callout response slide and each slide component in Markdown
   */
  public async slideAndWaitForMessage(
    ctx: Context,
    slide: CalloutSlideSchema,
  ) {
    const answerMessages: Message[] = [];

    for (const component of slide.components) {
      const componentAnswerMessage = await this.componentAndWaitForMessage(
        ctx,
        component,
      );
      answerMessages.push(componentAnswerMessage);
    }

    return answerMessages;
  }

  /**
   * Render a callout response in Markdown
   * @param callout The callout to render
   * @param slideNum The slide number to render
   * @returns
   */
  public async responseAndWaitForMessage(
    ctx: Context,
    callout: GetCalloutDataWithExt<"form">,
  ) {
    const form = callout.formSchema;

    const slidesAnswerMessages: Message[] = [];

    for (const slide of form.slides) {
      console.debug("Rendering slide", slide);
      const answerMessages = await this.slideAndWaitForMessage(ctx, slide);
      slidesAnswerMessages.push(...answerMessages);
    }

    return slidesAnswerMessages;
  }
}

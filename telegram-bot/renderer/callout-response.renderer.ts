import { Singleton } from "alosaur/mod.ts";
import { escapeMd, sanitizeHtml } from "../utils/index.ts";
import { RenderResultType } from "../enums/index.ts";
import {
  EventService,
  KeyboardService,
  RenderService,
} from "../services/index.ts";
import {
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
  DONE_MESSAGE,
} from "../constants/index.ts";

import type {
  BaseCalloutComponentSchema,
  CalloutComponentSchema,
  CalloutSlideSchema,
  Context,
  GetCalloutDataWithExt,
  InputCalloutComponentSchema,
  RadioCalloutComponentSchema,
  RenderResult,
  RenderResultEmpty,
} from "../types/index.ts";

const empty: RenderResultEmpty = {
  type: RenderResultType.EMPTY,
  keyboard: undefined,
};

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

  /**
   * Render a component label in Markdown
   */
  protected label(component: BaseCalloutComponentSchema) {
    if (!component.label) {
      return empty;
    }
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: `*${escapeMd(component.label)}*`,
    };

    return result;
  }

  /**
   * Render a component description in Markdown
   */
  protected description(component: BaseCalloutComponentSchema) {
    if (typeof component.description !== "string" || !component.description) {
      return empty;
    }

    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: `${escapeMd(component.description)}`,
    };

    return result;
  }

  /**
   * Render an input component placeholder in Markdown
   * @param input The input component to render
   */
  protected placeholder(input: InputCalloutComponentSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };

    if (input.placeholder) {
      result.markdown = `_${
        escapeMd(`Please respond with something like "${input.placeholder}".`)
      }_`;
    }

    return result;
  }

  protected multiple(component: BaseCalloutComponentSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };
    if (component.multiple) {
      result.markdown += `_${
        escapeMd(
          `You can enter multiple values by sending each value separately. If you are finished with your response, write "${DONE_MESSAGE}".`,
        )
      }_`;
    } else {
      result.markdown += `_${
        escapeMd(
          `You can only enter one value. If you are finished with your response, write "${DONE_MESSAGE}".`,
        )
      }_`;
    }

    return result;
  }

  /**
   * Render radio or select values in Markdown
   * @param radio The radio component to render
   */
  protected radioValues(radio: RadioCalloutComponentSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };

    let n = 1;
    for (const radioValue of radio.values) {
      result.markdown += `*${escapeMd(`${n}. ${radioValue.label}`)}*\n`;
      n++;
    }

    return result;
  }

  /**
   * Render the basics of a component in Markdown
   */
  protected baseComponent(base: BaseCalloutComponentSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };

    // Label
    const label = this.label(base);
    if (
      label.type === RenderResultType.MARKDOWN && label.markdown
    ) {
      result.markdown += `${label.markdown}\n`;
    }

    // Description
    const desc = this.description(base);
    if (
      desc.type === RenderResultType.MARKDOWN &&
      desc.markdown
    ) {
      result.markdown += `${desc.markdown}\n`;
    }

    return result;
  }
  /**
   * Render an input component in Markdown
   */
  protected inputComponent(input: InputCalloutComponentSchema) {
    const result = this.baseComponent(input);
    result.markdown += `\n\n`;

    switch (input.type) {
      case "address": {
        result.markdown += `_${
          escapeMd(
            input.multiple
              ? "You can enter one or more addresses."
              : "Please enter an address.",
          )
        }_`;
        break;
      }
      case "button": {
        result.markdown += `_${
          escapeMd("button input component not implemented")
        }_`;
        break;
      }
      case "checkbox": {
        result.markdown += `_${
          escapeMd("checkbox input component not implemented")
        }_`;
        break;
      }
      case "email": {
        result.markdown += `_${
          escapeMd(
            input.multiple
              ? "You can enter one or more emails."
              : "Please enter an email.",
          )
        }_`;
        break;
      }
      case "file": {
        result.markdown += `_${
          escapeMd(
            input.multiple
              ? "Please upload the file here."
              : "Please upload the files here.",
          )
        }_`;
        break;
      }
      case "number": {
        result.markdown += `_${
          escapeMd(
            input.multiple
              ? "Please enter one or more numbers."
              : "Please enter a number.",
          )
        }_`;
        break;
      }
      case "password": {
        result.markdown += `_${
          escapeMd(
            "You should enter a password here, and it's best to delete your response after sending it so the password doesn't remain in the history.",
          )
        }_`;
        break;
      }
      case "textfield": {
        result.markdown += `_${
          escapeMd(
            "Please keep it brief and try to answer in one sentence.",
          )
        }_`;
        break;
      }
      case "textarea": {
        result.markdown += `_${
          escapeMd(
            "You may answer in multiple lines, but please only send the response when you have finished writing.",
          )
        }_`;
        break;
      }
      default: {
        result.markdown += `Unknown input component type ${
          (input as InputCalloutComponentSchema).type || "undefined"
        }`;
        break;
      }
    }

    if (input.placeholder) {
      result.markdown += `\n\n${this.placeholder(input).markdown}`;
    }

    if (input.multiple) {
      result.markdown += `\n\n${this.multiple(input).markdown}`;
    }

    return result;
  }

  protected radioComponent(radio: RadioCalloutComponentSchema) {
    const result = this.baseComponent(radio);
    result.markdown += `\n${this.radioValues(radio).markdown}`;

    result.markdown += `\n\n`;

    switch (radio.type) {
      case "radio": {
        result.markdown += `_${
          escapeMd(
            "Please make your selection by typing the number of your choice or pressing the button of your choice. Only one selection is allowed.",
          )
        }_`;
        break;
      }
      case "selectboxes": {
        result.markdown += `_${
          escapeMd(
            "Please make your selection by typing the numbers of your multiple choices, separated by a comma, or by pressing the buttons of your choice. Multiple selections are allowed.",
          )
        }_`;
        break;
      }
    }

    return result;
  }

  public component(component: CalloutComponentSchema) {
    console.debug("Rendering component", component);
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };

    switch (component.type) {
      // Input components
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

      // Radio components
      case "radio":
      case "selectboxes": {
        result.markdown = this.radioComponent(component).markdown;
        break;
      }

      case "panel": {
        result.markdown = `panel component not implemented`;
        break;
      }
      case "select": {
        result.markdown = `select component not implemented`;
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

  /**
   * Render a callout component in Markdown and wait for a message response
   */
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

    return answer;
  }

  /**
   * Render a callout component in Markdown and wait for a message response
   */
  public async componentAndWaitForDoneMessage(
    ctx: Context,
    component: CalloutComponentSchema,
  ) {
    const answers = await this.render.replayAndWaitForDoneMessage(
      ctx,
      this.component(component),
    );

    return answers;
  }

  /**
   * Render a callout response slide and each slide component in Markdown
   */
  public async slideAndWaitForMessage(
    ctx: Context,
    slide: CalloutSlideSchema,
  ) {
    const answerMessages: Context[] = [];

    console.debug("Rendering slide", slide);

    for (const component of slide.components) {
      if (component.multiple) {
        const componentAnswerMessages = await this
          .componentAndWaitForDoneMessage(
            ctx,
            component,
          );
        answerMessages.push(...componentAnswerMessages);
        continue;
      }

      const componentAnswerMessage = await this.componentAndWaitForMessage(
        ctx,
        component,
      );
      answerMessages.push(componentAnswerMessage);
    }

    return answerMessages;
  }

  /**
   * Render a callout response intro in HTML
   */
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

  /**
   * Render the callout response thank you
   */
  public thankYou(callout: GetCalloutDataWithExt<"form">) {
    const result: RenderResult = {
      type: RenderResultType.HTML,
      html: ``,
    };

    if (callout.thanksTitle) {
      result.html += sanitizeHtml(`<strong>${callout.thanksTitle}</strong>\n`);
    }

    if (callout.thanksText) {
      result.html += sanitizeHtml(`${callout.thanksText}\n`);
    }

    console.debug("Rendering thank you", result.html);

    return result;
  }

  /**
   * Render a full callout response in Markdown and wait for a message responses
   * @param callout The callout to render
   * @param slideNum The slide number to render
   * @returns
   */
  public async fullResponseAndWaitForMessage(
    ctx: Context,
    callout: GetCalloutDataWithExt<"form">,
  ) {
    const form = callout.formSchema;

    const slidesAnswerMessages: Context[] = [];

    for (const slide of form.slides) {
      const answerMessages = await this.slideAndWaitForMessage(ctx, slide);
      slidesAnswerMessages.push(...answerMessages);
    }

    const thankYou = this.thankYou(callout);
    this.render.reply(ctx, thankYou);

    return slidesAnswerMessages;
  }
}

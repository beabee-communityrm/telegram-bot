// deno-lint-ignore-file no-fallthrough
import { Singleton } from "alosaur/mod.ts";
import { escapeMd, sanitizeHtml } from "../utils/index.ts";
import { RenderResultType } from "../enums/index.ts";
import {
  CommunicationService,
  EventService,
  KeyboardService,
} from "../services/index.ts";
import { MessageRenderer } from "./message.renderer.ts";
import {
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
  DONE_MESSAGE,
  EMPTY_RENDER_RESULT,
} from "../constants/index.ts";

import type {
  BaseCalloutComponentSchema,
  CalloutComponentSchema,
  CalloutSlideSchema,
  GetCalloutDataWithExt,
  InputCalloutComponentSchema,
  NestableCalloutComponentSchema,
  RadioCalloutComponentSchema,
  RenderResult,
  SelectCalloutComponentSchema,
} from "../types/index.ts";

/**
 * Render callout responses for Telegram in Markdown
 */
@Singleton()
export class CalloutResponseRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
    protected readonly event: EventService,
    protected readonly communication: CommunicationService,
    protected readonly messageRenderer: MessageRenderer,
  ) {
    console.debug(`${CalloutResponseRenderer.name} created`);
  }

  /**
   * Render a component label in Markdown
   */
  protected label(component: BaseCalloutComponentSchema) {
    if (!component.label) {
      return EMPTY_RENDER_RESULT;
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
      return EMPTY_RENDER_RESULT;
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
          `You can enter multiple values by sending each value separately. ${
            this.messageRenderer.writeDoneMessage(DONE_MESSAGE).text
          }`,
        )
      }_`;
    } else {
      result.markdown += `_${
        escapeMd(
          `You can only enter one value. ${
            this.messageRenderer.writeDoneMessage(DONE_MESSAGE).text
          }`,
        )
      }_`;
    }

    return result;
  }

  /**
   * Render radio or selectboxes values in Markdown
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

  protected selectValues(select: SelectCalloutComponentSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: ``,
    };

    let n = 1;
    for (const selectValue of select.data.values) {
      result.markdown += `*${escapeMd(`${n}. ${selectValue.label}`)}*\n`;
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
      acceptedBefore: this.communication.replayConditionText(),
    };

    // Wait for replay(s)
    result.acceptedUntil = this.communication.replayConditionText(
      base.multiple ? DONE_MESSAGE : undefined,
    );

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

  protected inputFileComponent(file: InputCalloutComponentSchema) {
    const result = this.baseComponent(file);
    result.markdown += `\n\n`;

    result.markdown += `_${
      escapeMd(
        file.multiple
          ? "Please upload the files here."
          : "Please upload the file here.",
      )
    }_`;

    // TODO: Missing in common types
    if (file.type as unknown === "signature") {
      result.acceptedBefore = this.communication.replayConditionFilePattern(
        "image/*",
      );
    } else {
      result.acceptedBefore = this.communication.replayConditionFilePattern(
        file.filePattern as string || file.type as unknown === "signature"
          ? "image/*"
          : "",
      );
    }

    if (file.multiple) {
      result.acceptedUntil = this.communication.replayConditionText(
        DONE_MESSAGE,
      );
    } else {
      result.acceptedUntil = this.communication.replayConditionFilePattern(
        file.filePattern as string || "",
      );
    }

    if (file.placeholder) {
      result.markdown += `\n\n${this.placeholder(file).markdown}`;
    }

    if (file.multiple) {
      result.markdown += `\n\n${this.multiple(file).markdown}`;
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
      // TODO: Missing in common types
      case "content" as unknown: {
        result.markdown += `_${
          escapeMd(
            "You may answer in multiple lines, but please only send the response when you have finished writing. You can also use Markdown formatting.",
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "phoneNumber" as unknown: {
        result.markdown += `_${
          escapeMd(
            "Please enter a telephone number.",
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "currency" as unknown: {
        result.markdown += `_${
          escapeMd(
            "Please enter an amount of money.",
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "datetime" as unknown: {
        result.markdown += `_${
          escapeMd(
            "Please enter a date.",
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "time" as unknown: {
        result.markdown += `_${
          escapeMd(
            "Please enter a time.",
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "url" as unknown: {
        result.markdown += `_${
          escapeMd(
            "Please enter a URL.",
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
            "Please make your selection by typing the number choices. " +
              "Multiple selections are allowed, please send a separate message for each of your selection. " +
              this.messageRenderer.writeDoneMessage(DONE_MESSAGE).text,
          )
        }_`;
        result.acceptedUntil = this.communication.replayConditionText(
          DONE_MESSAGE,
        );
        break;
      }
    }

    return result;
  }

  /**
   * Render a select component in Markdown.
   * Note: A select component is a dropdown menu in the frontend.
   */
  protected selectComponent(select: SelectCalloutComponentSchema) {
    const result = this.baseComponent(select);
    result.markdown += `\n${this.selectValues(select).markdown}`;

    result.markdown += `\n\n`;

    result.markdown += `_${
      escapeMd(
        "Please make your selection by typing the number of your choice or pressing the button of your choice. Only one selection is allowed.",
      )
    }_`;
    return result;
  }

  /**
   * Render a callout response slide or nestable component and each nested component in Markdown
   */
  public nestableComponent(
    nestable: NestableCalloutComponentSchema | CalloutSlideSchema,
  ) {
    const nestableResults: RenderResult[] = [];

    for (const component of nestable.components) {
      const componentRenderResults = this.component(component);
      nestableResults.push(...componentRenderResults);
    }

    return nestableResults;
  }

  public component(component: CalloutComponentSchema) {
    console.debug("Rendering component", component);
    const results: RenderResult[] = [];

    switch (component.type) {
      // Input components
      case "address":
      case "button":
      case "checkbox":
      case "email":
      case "number":
      case "password":
      case "textfield":
      case "textarea":
      // TODO: missing in common types
      case "content" as unknown:
      case "phoneNumber" as unknown:
      case "currency" as unknown:
      case "datetime" as unknown:
      case "time" as unknown:
      case "url" as unknown: {
        results.push(
          this.inputComponent(component as InputCalloutComponentSchema),
        );
        break;
      }

      case "file":
        // TODO: missing in common types
      case "signature" as unknown: {
        results.push(this.inputFileComponent(
          component as InputCalloutComponentSchema,
        ));
        break;
      }

      // Radio components
      case "radio":
      case "selectboxes": {
        results.push(this.radioComponent(component));
        break;
      }

      // TODO: next
      case "select": {
        results.push(this.selectComponent(component));
        break;
      }

      case "panel":
      case "tabs":
      case "well": {
        results.push(...this.nestableComponent(component));
        break;
      }

      default: {
        console.warn("Rendering unknown component", component);
        const unknown: RenderResult = {
          type: RenderResultType.MARKDOWN,
          markdown: `Unknown component type ${
            (component as CalloutComponentSchema).type || "undefined"
          }`,
        };
        results.push(unknown);
        break;
      }
    }

    return results;
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
  public thankYouPage(callout: GetCalloutDataWithExt<"form">) {
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
   * Render a full callout response with all it's forms / components in Markdown and wait for a message responses
   * @param callout The callout to render
   * @returns
   */
  public full(
    callout: GetCalloutDataWithExt<"form">,
  ) {
    const form = callout.formSchema;

    const slidesRenderResults: RenderResult[] = [];

    for (const slide of form.slides) {
      const replays = this.nestableComponent(slide);
      slidesRenderResults.push(...replays);
    }

    const thankYou = this.thankYouPage(callout);

    return [...slidesRenderResults, thankYou];
  }
}

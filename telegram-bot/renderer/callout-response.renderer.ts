import { Singleton } from "alosaur/mod.ts";
import {
  calloutComponentTypeToMainType,
  calloutComponentTypeToParsedResponseType,
  createCalloutGroupKey,
  escapeMd,
  sanitizeHtml,
} from "../utils/index.ts";
import {
  CalloutComponentMainType,
  ParsedResponseType,
  RenderType,
} from "../enums/index.ts";
import {
  CommunicationService,
  EventService,
  KeyboardService,
} from "../services/index.ts";
import { MessageRenderer } from "./message.renderer.ts";
import {
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
  DONE_MESSAGE,
  EMPTY_RENDER,
} from "../constants/index.ts";

import type {
  BaseCalloutComponentSchema,
  CalloutComponentSchema,
  CalloutSlideSchema,
  GetCalloutDataWithExt,
  InputCalloutComponentSchema,
  NestableCalloutComponentSchema,
  RadioCalloutComponentSchema,
  Render,
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
   * @param component The component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected label(component: BaseCalloutComponentSchema, prefix: string) {
    if (!component.label) {
      return EMPTY_RENDER;
    }
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      multiple: false,
      accepted: this.communication.replayConditionNone(),
      markdown: `*${escapeMd(component.label)}*`,
      parseType: calloutComponentTypeToParsedResponseType(component),
    };

    return result;
  }

  /**
   * Render a component description in Markdown
   */
  protected description(component: BaseCalloutComponentSchema, prefix: string) {
    if (typeof component.description !== "string" || !component.description) {
      return EMPTY_RENDER;
    }

    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      multiple: false,
      accepted: this.communication.replayConditionNone(),
      markdown: `${escapeMd(component.description)}`,
      parseType: calloutComponentTypeToParsedResponseType(component),
    };

    return result;
  }

  /**
   * Render an input component placeholder in Markdown
   * @param input The input component to render
   */
  protected placeholder(input: InputCalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(input.key, prefix),
      type: RenderType.MARKDOWN,
      multiple: false,
      accepted: this.communication.replayConditionNone(),
      markdown: ``,
      parseType: calloutComponentTypeToParsedResponseType(input),
    };

    if (input.placeholder) {
      result.markdown = `_${
        escapeMd(`Please respond with something like "${input.placeholder}".`)
      }_`;
    }

    return result;
  }

  protected multiple(component: BaseCalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      multiple: (component.multiple || false) as boolean,
      accepted: this.communication.replayConditionNone(),
      markdown: ``,
      parseType: calloutComponentTypeToParsedResponseType(component),
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
  protected radioValues(radio: RadioCalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(radio.key, prefix),
      type: RenderType.MARKDOWN,
      multiple:
        (radio.multiple || radio.type === "selectboxes" || false) as boolean, // Selectboxes are always multiple
      accepted: this.communication.replayConditionText(), // Wait for index which is a text message
      markdown: ``,
      parseType: calloutComponentTypeToParsedResponseType(radio),
    };

    let n = 1;
    for (const radioValue of radio.values) {
      result.markdown += `*${escapeMd(`${n}. ${radioValue.label}`)}*\n`;
      n++;
    }

    return result;
  }

  /**
   * Note: A select component is a dropdown menu in the frontend.
   * @param select
   * @param prefix
   * @returns
   */
  protected selectValues(select: SelectCalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(select.key, prefix),
      type: RenderType.MARKDOWN,
      multiple: (select.multiple || false) as boolean, // TODO: Is a dropdown never multiple?
      markdown: ``,
      accepted: this.communication.replayConditionText(), // Wait for index which is a text message
      parseType: calloutComponentTypeToParsedResponseType(select),
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
   * @param base The base component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected baseComponent(base: BaseCalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(base.key, prefix),
      type: RenderType.MARKDOWN,
      markdown: ``,
      multiple: (base.multiple || false) as boolean,
      accepted: this.communication.replayConditionText(),
      parseType: calloutComponentTypeToParsedResponseType(base),
    };

    // Wait for replay(s)
    result.accepted = this.communication.replayConditionText(
      base.multiple ? DONE_MESSAGE : undefined,
    );

    // Label
    const label = this.label(base, prefix);
    if (
      label.type === RenderType.MARKDOWN && label.markdown
    ) {
      result.markdown += `${label.markdown}\n`;
    }

    // Description
    const desc = this.description(base, prefix);
    if (
      desc.type === RenderType.MARKDOWN &&
      desc.markdown
    ) {
      result.markdown += `${desc.markdown}\n`;
    }

    return result;
  }

  /**
   * Render an input file component in Markdown
   * @param file The input file component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected inputFileComponent(
    file: InputCalloutComponentSchema,
    prefix: string,
  ) {
    const result = this.baseComponent(file, prefix);
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
      result.accepted = this.communication.replayConditionFilePattern(
        "image/*",
      );
    } else {
      result.accepted = this.communication.replayConditionFilePattern(
        file.filePattern as string || file.type as unknown === "signature"
          ? "image/*"
          : "",
      );
    }

    if (file.multiple) {
      result.accepted = this.communication.replayConditionText(
        DONE_MESSAGE,
      );
    } else {
      result.accepted = this.communication.replayConditionFilePattern(
        file.filePattern as string || "",
      );
    }

    if (file.placeholder) {
      result.markdown += `\n\n${this.placeholder(file, prefix).markdown}`;
    }

    if (file.multiple) {
      result.markdown += `\n\n${this.multiple(file, prefix).markdown}`;
    }

    return result;
  }

  /**
   * Render an input component in Markdown
   * @param input The input component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected inputComponent(input: InputCalloutComponentSchema, prefix: string) {
    const result = this.baseComponent(input, prefix);
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
      result.markdown += `\n\n${this.placeholder(input, prefix).markdown}`;
    }

    if (input.multiple) {
      result.markdown += `\n\n${this.multiple(input, prefix).markdown}`;
    }

    return result;
  }

  /**
   * Render a radio component in Markdown
   * @param radio The radio component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected radioComponent(radio: RadioCalloutComponentSchema, prefix: string) {
    const result = this.baseComponent(radio, prefix);
    result.markdown += `\n${this.radioValues(radio, prefix).markdown}`;

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
        result.multiple = true;
        result.accepted = this.communication.replayConditionText(
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
   * @param select The select component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected selectComponent(
    select: SelectCalloutComponentSchema,
    prefix: string,
  ) {
    const result = this.baseComponent(select, prefix);
    result.markdown += `\n${this.selectValues(select, prefix).markdown}`;

    result.markdown += `\n\n`;

    result.markdown += `_${
      escapeMd(
        "Please make your selection by typing the number of your choice or pressing the button of your choice. Only one selection is allowed.",
      )
    }_`;
    return result;
  }

  public component(component: CalloutComponentSchema, prefix: string) {
    console.debug("Rendering component", component);
    const results: Render[] = [];

    const mainType = calloutComponentTypeToMainType(component);

    switch (mainType) {
      case CalloutComponentMainType.INPUT: {
        results.push(
          this.inputComponent(component as InputCalloutComponentSchema, prefix),
        );
        break;
      }

      case CalloutComponentMainType.FILE: {
        results.push(this.inputFileComponent(
          component as InputCalloutComponentSchema,
          prefix,
        ));
        break;
      }

      case CalloutComponentMainType.RADIO: {
        results.push(
          this.radioComponent(component as RadioCalloutComponentSchema, prefix),
        );
        break;
      }

      case CalloutComponentMainType.SELECT: {
        results.push(
          this.selectComponent(
            component as SelectCalloutComponentSchema,
            prefix,
          ),
        );
        break;
      }

      case CalloutComponentMainType.NESTED: {
        results.push(
          ...this.nestableComponent(
            component as NestableCalloutComponentSchema,
            prefix,
          ),
        );
        break;
      }

      case CalloutComponentMainType.UNKNOWN:
      default: {
        console.warn("Rendering unknown component", component, prefix);
        const unknown: Render = {
          key: createCalloutGroupKey(component.key, prefix),
          type: RenderType.MARKDOWN,
          accepted: this.communication.replayConditionAny(),
          multiple: (component.multiple || false) as boolean,
          markdown: `Unknown component type ${
            (component as CalloutComponentSchema).type || "undefined"
          }`,
          parseType: calloutComponentTypeToParsedResponseType(component),
        };
        results.push(unknown);
        break;
      }
    }

    return results;
  }

  /**
   * Render a callout response slide or nestable component and each nested component in Markdown
   * @param nestable The nestable component or slide to render
   * @param prefix The prefix, used to group the answers later (only used for slides)
   */
  public nestableComponent(
    nestable: NestableCalloutComponentSchema | CalloutSlideSchema,
    prefix: string,
  ) {
    const nestableResults: Render[] = [];

    for (const component of nestable.components) {
      const componentRenders = this.component(component, prefix);
      nestableResults.push(...componentRenders);
    }

    return nestableResults;
  }

  /**
   * Render a callout response intro in HTML
   */
  public intro(callout: GetCalloutDataWithExt<"form">) {
    const result: Render = {
      key: callout.slug,
      type: RenderType.HTML,
      multiple: false,
      accepted: this.communication.replayConditionNone(),
      html: "",
      parseType: ParsedResponseType.NONE,
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
    const result: Render = {
      key: callout.slug,
      type: RenderType.HTML,
      multiple: false,
      accepted: this.communication.replayConditionNone(),
      html: ``,
      parseType: ParsedResponseType.NONE,
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

    const slidesRenders: Render[] = [];

    for (const slide of form.slides) {
      const replays = this.nestableComponent(slide, slide.id);
      slidesRenders.push(...replays);
    }

    const thankYou = this.thankYouPage(callout);

    return [...slidesRenders, thankYou];
  }
}

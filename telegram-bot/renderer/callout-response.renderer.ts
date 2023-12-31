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
import { ConditionService, KeyboardService } from "../services/index.ts";
import { MessageRenderer } from "./message.renderer.ts";
import {
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
  CHECKBOX_FALSY,
  CHECKBOX_TRUTHY,
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
  RenderMarkdown,
  SelectCalloutComponentSchema,
} from "../types/index.ts";

/**
 * Render callout responses for Telegram in Markdown
 */
@Singleton()
export class CalloutResponseRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly condition: ConditionService,
  ) {
    console.debug(`${CalloutResponseRenderer.name} created`);
  }

  protected isMultiple(component: BaseCalloutComponentSchema) {
    if (component.multiple) {
      return true;
    }
    if (component.type === "selectboxes") {
      return true;
    }
    return false;
  }

  /**
   * Render a component label in Markdown
   * @param component The component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected labelMd(component: BaseCalloutComponentSchema, prefix: string) {
    if (!component.label) {
      return EMPTY_RENDER;
    }
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(),
      markdown: `*${escapeMd(component.label)}*`,
      parseType: calloutComponentTypeToParsedResponseType(component),
    };

    return result;
  }

  /**
   * Render a component description in Markdown
   */
  protected descriptionMd(
    component: BaseCalloutComponentSchema,
    prefix: string,
  ) {
    if (typeof component.description !== "string" || !component.description) {
      return EMPTY_RENDER;
    }

    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(),
      markdown: `${escapeMd(component.description)}`,
      parseType: calloutComponentTypeToParsedResponseType(component),
    };

    return result;
  }

  /**
   * Render an input component placeholder in Markdown
   * @param input The input component to render
   */
  protected placeholderMd(input: InputCalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(input.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(),
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

  protected multipleMd(component: BaseCalloutComponentSchema, prefix: string) {
    const multiple = this.isMultiple(component);
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(multiple),
      markdown: ``,
      parseType: calloutComponentTypeToParsedResponseType(component),
    };
    if (multiple) {
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
    // Selectboxes are always multiple
    const multiple = this.isMultiple(radio);
    const result: Render = {
      key: createCalloutGroupKey(radio.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionSelection(
        multiple,
        this.selectValuesToValueLabelPairs(radio.values),
        multiple ? [DONE_MESSAGE] : [],
      ),
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
    // TODO: Is a dropdown never multiple?
    const multiple = this.isMultiple(select);
    const result: Render = {
      key: createCalloutGroupKey(select.key, prefix),
      type: RenderType.MARKDOWN,
      markdown: ``,
      accepted: this.condition.replayConditionSelection(
        multiple,
        this.selectValuesToValueLabelPairs(select.data.values),
      ), // Wait for index which is a text message
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
    const multiple = this.isMultiple(base);
    const result: Render = {
      key: createCalloutGroupKey(base.key, prefix),
      type: RenderType.MARKDOWN,
      markdown: ``,
      accepted: this.condition.replayConditionText(
        multiple,
        undefined,
        multiple ? [DONE_MESSAGE] : [],
      ),
      parseType: calloutComponentTypeToParsedResponseType(base),
    };

    // Label
    const label = this.labelMd(base, prefix);
    if (
      label.type === RenderType.MARKDOWN && label.markdown
    ) {
      result.markdown += `${label.markdown}\n`;
    }

    // Description
    const desc = this.descriptionMd(base, prefix);
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
    const multiple = this.isMultiple(file);
    const result = this.baseComponent(file, prefix);
    result.markdown += `\n\n`;

    result.markdown += `_${
      escapeMd(
        multiple
          ? "Please upload the files here."
          : "Please upload the file here.",
      )
    }_`;

    result.accepted = this.condition.replayConditionFilePattern(
      multiple,
      // TODO: Fix `filePattern` property in common types
      file.filePattern || file.type as unknown === "signature" ? "image/*" : "",
      multiple ? [DONE_MESSAGE] : [],
    );

    if (file.placeholder) {
      result.markdown += `\n\n${this.placeholderMd(file, prefix).markdown}`;
    }

    if (multiple) {
      result.markdown += `\n\n${this.multipleMd(file, prefix).markdown}`;
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
            result.accepted.multiple
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
          escapeMd(
            `Please answer with "${CHECKBOX_TRUTHY}" or "${CHECKBOX_FALSY}".`,
          )
        }_`;
        result.accepted = this.condition.replayConditionText(
          result.accepted.multiple,
          [CHECKBOX_TRUTHY, CHECKBOX_FALSY],
          result.accepted.multiple ? [DONE_MESSAGE] : [],
        );
        break;
      }
      case "email": {
        result.markdown += `_${
          escapeMd(
            result.accepted.multiple
              ? "You can enter one or more emails."
              : "Please enter an email.",
          )
        }_`;
        break;
      }
      case "number": {
        result.markdown += `_${
          escapeMd(
            result.accepted.multiple
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
      result.markdown += `\n\n${this.placeholderMd(input, prefix).markdown}`;
    }

    if (input.multiple) {
      result.markdown += `\n\n${this.multipleMd(input, prefix).markdown}`;
    }

    return result;
  }

  /**
   * Render a radio component in Markdown
   * @param radio The radio component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected radioComponent(
    radio: RadioCalloutComponentSchema,
    prefix: string,
  ): RenderMarkdown {
    const result = this.baseComponent(radio, prefix);

    const multiple = result.accepted.multiple;

    result.accepted = {
      ...result.accepted,
      ...this.condition.replayConditionSelection(
        multiple,
        this.selectValuesToValueLabelPairs(radio.values),
        multiple ? [DONE_MESSAGE] : [],
      ),
    };

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
        break;
      }
    }

    return result;
  }

  protected selectValuesToValueLabelPairs(
    values: { value: string; label: string }[],
  ) {
    const pairs: Record<string, string> = {};
    let n = 1;
    for (const selectValue of values) {
      pairs[selectValue.value] = selectValue.label;
      n++;
    }
    return pairs;
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
  ): RenderMarkdown {
    const result = this.baseComponent(select, prefix);
    result.accepted = {
      ...result.accepted,
      ...this.condition.replayConditionSelection(
        result.accepted.multiple,
        this.selectValuesToValueLabelPairs(select.data.values),
      ),
    };
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
        const multiple = this.isMultiple(component);
        const unknown: Render = {
          key: createCalloutGroupKey(component.key, prefix),
          type: RenderType.MARKDOWN,
          accepted: this.condition.replayConditionAny(multiple),

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
      accepted: this.condition.replayConditionNone(),
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
      accepted: this.condition.replayConditionNone(),
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

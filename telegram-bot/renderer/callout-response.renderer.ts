import {
  CalloutComponentBaseType,
  CalloutComponentContentSchema,
  CalloutComponentInputCheckboxSchema,
  CalloutComponentInputFileSchema,
  CalloutComponentInputSchema,
  CalloutComponentInputSelectableSchema,
  CalloutComponentInputSelectSchema,
  CalloutComponentNestableSchema,
  CalloutComponentSchema,
  CalloutComponentType,
  CalloutSlideSchema,
  isCalloutComponentOfBaseType,
  isCalloutComponentOfType,
  Singleton,
} from "../deps/index.ts";
import {
  calloutComponentTypeToParsedResponseType,
  createCalloutGroupKey,
  escapeHtml,
  escapeMd,
  range,
  sanitizeHtml,
} from "../utils/index.ts";
import { ParsedResponseType, RenderType } from "../enums/index.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { ConditionService } from "../services/condition.service.ts";
import { MessageRenderer } from "./message.renderer.ts";
import {
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
  EMPTY_RENDER,
} from "../constants/index.ts";

import type {
  GetCalloutDataWithExt,
  Render,
  RenderMarkdown,
} from "../types/index.ts";
import { CalloutComponentInputSignatureSchema } from "../deps/index.ts";

/**
 * Render callout responses for Telegram in Markdown
 */
@Singleton()
export class CalloutResponseRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly condition: ConditionService,
    protected readonly i18n: I18nService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  protected isMultiple(component: CalloutComponentSchema) {
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
   * @param component The component to render this label for
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected labelMd(component: CalloutComponentSchema, prefix: string) {
    if (!component.label) {
      return EMPTY_RENDER;
    }
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(),
      markdown: `*${escapeMd(component.label)}*`,
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };

    return result;
  }

  /**
   * Render a component description in Markdown
   * @param component The component to render this description for
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected descriptionMd(component: CalloutComponentSchema, prefix: string) {
    if (typeof component.description !== "string" || !component.description) {
      return EMPTY_RENDER;
    }

    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(),
      markdown: `${escapeMd(component.description)}`,
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };

    return result;
  }

  /**
   * Render an input component placeholder in Markdown
   * @param input The input component to render this placeholder note for
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected placeholderMd(input: CalloutComponentSchema, prefix: string) {
    const result: Render = {
      key: createCalloutGroupKey(input.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(),
      markdown: ``,
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };

    const placeholder = input.placeholder as string | undefined;

    if (placeholder) {
      result.markdown = `_${
        escapeMd(
          this.i18n.t("bot.info.messages.placeholder", { placeholder }),
        )
      }_`;
    }

    return result;
  }

  /**
   * Render a note to the user how many answers are expected
   * @param component The component to render this note for
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   * @returns
   */
  protected multipleMd(component: CalloutComponentSchema, prefix: string) {
    const multiple = this.isMultiple(component);
    const required = component.validate?.required || false;
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(multiple, required),
      markdown: ``,
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };
    if (multiple) {
      result.markdown += `\n\n_${
        escapeMd(
          `${this.i18n.t("bot.info.messages.multipleValuesAllowed")}\n\n${
            this.messageRenderer.writeDoneMessage(
              this.i18n.t("bot.reactions.messages.done"),
            ).text
          }`,
        )
      }_`;
    }

    return result;
  }

  /**
   * Render a note to the user if the answer is required
   * @param component The component to render this note for
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   * @returns
   */
  protected requiredMd(component: CalloutComponentSchema, prefix: string) {
    const multiple = this.isMultiple(component);
    const required = component.validate?.required || false;
    const result: Render = {
      key: createCalloutGroupKey(component.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionNone(multiple, required),
      markdown: ``,
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };
    if (!required) {
      result.markdown += `\n\n_${
        escapeMd(
          this.messageRenderer.writeSkipMessage(
            this.i18n.t("bot.reactions.messages.skip"),
          ).text,
        )
      }_`;
    }
    return result;
  }

  /**
   * Render notes and a keyboard with the answer options
   * - Renders a note to the user how many answers are expected
   * - Renders a note to the user if the answer is required
   * - Renders a Keyboard with the answer options
   * @param component The component to render this note and keyboard for
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected answerOptionsMdKeyboard(
    result: RenderMarkdown,
    component: CalloutComponentSchema,
    prefix: string,
    multiple = this.isMultiple(component),
    required = component.validate?.required || false,
  ) {
    const placeholder = component.placeholder;

    if (placeholder) {
      result.markdown += `\n\n${
        this.placeholderMd(component, prefix).markdown
      }`;
    }

    result.markdown += `${this.multipleMd(component, prefix).markdown}`;
    result.markdown += `${this.requiredMd(component, prefix).markdown}`;

    result.keyboard = this.keyboard.skipDone(
      result.keyboard,
      required,
      multiple,
    );

    return result;
  }

  /**
   * Render radio or selectboxes values in Markdown
   * @param selectable The selectable component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected selectableValues(
    selectable: CalloutComponentInputSelectableSchema,
    prefix: string,
    valueLabel: Record<string, string>,
  ) {
    // Selectboxes are always multiple
    const multiple = this.isMultiple(selectable);
    const required = selectable.validate?.required || false;
    const result: Render = {
      key: createCalloutGroupKey(selectable.key, prefix),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionSelection(
        multiple,
        required,
        valueLabel,
      ),
      markdown: ``,
      parseType: calloutComponentTypeToParsedResponseType(selectable),
      removeKeyboard: true,
    };

    let n = 1;
    for (const selectableValue of selectable.values) {
      result.markdown += `*${escapeMd(`${n}. ${selectableValue.label}`)}*\n`;
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
  protected selectValues(
    select: CalloutComponentInputSelectSchema,
    prefix: string,
    valueLabel: Record<string, string>,
  ) {
    // TODO: Is a dropdown never multiple?
    const multiple = this.isMultiple(select);
    const required = select.validate?.required || false;
    const result: Render = {
      key: createCalloutGroupKey(select.key, prefix),
      type: RenderType.MARKDOWN,
      markdown: ``,
      accepted: this.condition.replayConditionSelection(
        multiple,
        required,
        valueLabel,
      ), // Wait for index which is a text message
      parseType: calloutComponentTypeToParsedResponseType(select),
      removeKeyboard: true,
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
  protected baseComponent(base: CalloutComponentSchema, prefix: string) {
    const multiple = this.isMultiple(base);
    const required = base.validate?.required || false;
    const result: Render = {
      key: createCalloutGroupKey(base.key, prefix),
      type: RenderType.MARKDOWN,
      markdown: ``,
      accepted: this.condition.replayConditionCalloutComponent(
        multiple,
        required,
        base,
      ),
      parseType: ParsedResponseType.CALLOUT_COMPONENT,
      removeKeyboard: true,
    };

    // Label
    const label = this.labelMd(base, prefix);
    if (label.type === RenderType.MARKDOWN && label.markdown) {
      result.markdown += `${label.markdown}\n`;
    }

    // Description
    const desc = this.descriptionMd(base, prefix);
    if (desc.type === RenderType.MARKDOWN && desc.markdown) {
      result.markdown += `${desc.markdown}\n`;
    }

    return result;
  }

  /**
   * Render a note to the user how many files are expected
   * @param multiple If multiple files are expected
   * @returns The note in Markdown
   */
  protected howManyFilesMd(multiple?: boolean): string {
    return `_${
      escapeMd(
        multiple
          ? this.i18n.t("bot.info.messages.uploadFilesHere")
          : this.i18n.t("bot.info.messages.uploadFileHere"),
      )
    }_`;
  }

  /**
   * Render a note to the user how many addresses are expected
   * @param multiple If multiple addresses are expected
   * @returns The note in Markdown
   */
  protected howManyAddressesMd(multiple?: boolean): string {
    return `_${
      escapeMd(
        multiple
          ? this.i18n.t("bot.info.messages.multipleAddressesAllowed")
          : this.i18n.t("bot.info.messages.onlyOneAddressAllowed"),
      )
    }_`;
  }

  /**
   * Render a note to the user how many emails are expected
   * @param multiple If multiple emails are expected
   * @returns The note in Markdown
   */
  protected howManyEmailsMd(multiple?: boolean): string {
    return `_${
      escapeMd(
        multiple
          ? this.i18n.t("bot.info.messages.multipleEmailsAllowed")
          : this.i18n.t("bot.info.messages.onlyOneEmailAllowed"),
      )
    }_`;
  }

  /**
   * Render a note to the user how many numbers are expected
   * @param multiple If multiple numbers are expected
   * @returns The note in Markdown
   */
  protected howManyNumbersMd(multiple?: boolean): string {
    return `_${
      escapeMd(
        multiple
          ? this.i18n.t("bot.info.messages.multipleNumbersAllowed")
          : this.i18n.t("bot.info.messages.onlyOneNumberAllowed"),
      )
    }_`;
  }

  protected howManySelectionsMd(multiple?: boolean): string {
    return `_${
      escapeMd(
        multiple
          ? this.i18n.t("bot.info.messages.multipleSelectionsAllowed")
          : this.i18n.t("bot.info.messages.onlyOneSelectionAllowed"),
      )
    }_`;
  }

  protected textTypeMd(
    type:
      | CalloutComponentType.INPUT_TEXT_FIELD
      | CalloutComponentType.INPUT_TEXT_AREA,
  ) {
    if (type === CalloutComponentType.INPUT_TEXT_FIELD) {
      return `_${
        escapeMd(
          this.i18n.t("bot.info.messages.enterText"),
        )
      }_`;
    } else if (type === CalloutComponentType.INPUT_TEXT_AREA) {
      return `_${
        escapeMd(
          this.i18n.t("bot.info.messages.enterLotsOfText"),
        )
      }_`;
    }
  }

  /**
   * Render an input file component in Markdown
   * @param file The input file component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected inputFileComponent(
    file:
      | CalloutComponentInputFileSchema
      | CalloutComponentInputSignatureSchema,
    prefix: string,
  ) {
    const multiple = this.isMultiple(file);
    const required = file.validate?.required || false;
    const result = this.baseComponent(file, prefix);
    result.markdown += `\n\n`;

    result.markdown += this.howManyFilesMd(multiple);

    result.accepted = this.condition.replayConditionFilePattern(
      multiple,
      required,
      file.filePattern || file.type === "signature" ? "image/*" : "",
    );

    this.answerOptionsMdKeyboard(result, file, prefix);

    return result;
  }

  /**
   * Render an input signature component in Markdown
   * @param signature The input signature component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected inputSignatureComponent(
    signature: CalloutComponentInputSignatureSchema,
    prefix: string,
  ) {
    return this.inputFileComponent(signature, prefix);
  }

  /** A content component only prints a text and does not expect an answer */
  protected contentComponent(
    content: CalloutComponentContentSchema,
    prefix: string,
  ) {
    let html = "";

    if (content.label) {
      `<b>${escapeHtml(content.label)}</b>`;
      html += `%0A%0A`; // %0A is a newline
    }

    html += `${sanitizeHtml(content.html)}`;

    const result: Render = {
      key: createCalloutGroupKey(content.key, prefix),
      type: RenderType.HTML,
      html,
      accepted: this.condition.replayConditionNone(
        false,
        false,
      ),
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };

    return result;
  }

  protected inputCheckboxComponent(
    input: CalloutComponentInputCheckboxSchema,
    prefix: string,
  ) {
    const result = this.baseComponent(input, prefix);
    result.parseType = ParsedResponseType.BOOLEAN;
    result.markdown += `\n\n`;

    const truthyMessage = this.i18n.t("bot.reactions.messages.truthy");
    const falsyMessage = this.i18n.t("bot.reactions.messages.falsy");
    const doneMessage = this.i18n.t("bot.reactions.messages.done");
    const skipMessage = this.i18n.t("bot.reactions.messages.skip");
    const multiple = this.isMultiple(input);
    const required = result.accepted.required;

    result.markdown += `_${
      escapeMd(
        this.i18n.t("bot.response.messages.answerWithTruthyOrFalsy", {
          truthy: truthyMessage,
          falsy: falsyMessage,
        }),
      )
    }_`;

    result.accepted = this.condition.replayConditionText(
      multiple,
      required,
      [truthyMessage, falsyMessage],
      multiple ? [doneMessage] : [],
      !required ? [skipMessage] : [],
    );

    result.keyboard = this.keyboard.yesNo(
      result.keyboard,
      truthyMessage,
      falsyMessage,
    );

    this.answerOptionsMdKeyboard(result, input, prefix);

    return result;
  }

  /**
   * Render an input component in Markdown
   * @param input The input component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected inputComponent(input: CalloutComponentInputSchema, prefix: string) {
    const result = this.baseComponent(input, prefix);
    result.markdown += `\n\n`;
    const multiple = this.isMultiple(input);

    switch (input.type) {
      case CalloutComponentType.INPUT_ADDRESS: {
        result.markdown += this.howManyAddressesMd(multiple);
        break;
      }
      case CalloutComponentType.INPUT_EMAIL: {
        result.markdown += this.howManyEmailsMd(multiple);
        break;
      }
      case CalloutComponentType.INPUT_NUMBER: {
        result.markdown += this.howManyNumbersMd(multiple);
        break;
      }
      case CalloutComponentType.INPUT_TEXT_FIELD:
      case CalloutComponentType.INPUT_TEXT_AREA: {
        result.markdown += this.textTypeMd(input.type);
        break;
      }
      case CalloutComponentType.INPUT_PHONE_NUMBER: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterTelephoneNumber"),
          )
        }_`;
        break;
      }
      case CalloutComponentType.INPUT_CURRENCY: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterAmountOfMoney"),
          )
        }_`;
        break;
      }
      case CalloutComponentType.INPUT_DATE_TIME: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterDate"),
          )
        }_`;
        break;
      }
      case CalloutComponentType.INPUT_TIME: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterTime"),
          )
        }_`;
        break;
      }
      case CalloutComponentType.INPUT_URL: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterUrl"),
          )
        }_`;
        break;
      }

      default: {
        result.markdown += this.i18n.t(
          "bot.response.messages.componentUnknown",
          {
            type: (input as CalloutComponentSchema).type || "undefined",
          },
        );
        break;
      }
    }

    this.answerOptionsMdKeyboard(result, input, prefix, multiple);

    return result;
  }

  /**
   * Render a select component in Markdown.
   * Note: A select component is a dropdown menu in the frontend.
   * @param select The select component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected selectComponent(
    select: CalloutComponentInputSelectSchema,
    prefix: string,
  ): RenderMarkdown {
    const result = this.baseComponent(select, prefix);
    result.parseType = ParsedResponseType.SELECTION;
    const multiple = this.isMultiple(select);
    const required = result.accepted.required;
    const valueLabel = this.selectValuesToValueLabelPairs(select.data.values);

    result.accepted = {
      ...result.accepted,
      ...this.condition.replayConditionSelection(
        multiple,
        required,
        valueLabel,
      ),
    };
    result.markdown += `\n${
      this.selectValues(select, prefix, valueLabel).markdown
    }`;

    result.markdown += `\n\n`;

    result.markdown += this.howManySelectionsMd(multiple);

    result.keyboard = this.keyboard.selection(
      result.keyboard,
      range(1, Object.keys(valueLabel).length).map(String),
    );

    this.answerOptionsMdKeyboard(result, select, prefix);

    return result;
  }

  /**
   * Render a radio component in Markdown
   * @param radio The radio component to render
   * @param prefix The prefix, used to group the answers later (only used to group slides)
   */
  protected selectableComponent(
    selectable: CalloutComponentInputSelectableSchema,
    prefix: string,
  ): RenderMarkdown {
    const result = this.baseComponent(selectable, prefix);
    result.parseType = ParsedResponseType.SELECTION;
    const multiple = this.isMultiple(selectable);
    const required = result.accepted.required;
    const valueLabel = this.selectValuesToValueLabelPairs(selectable.values);

    result.accepted = {
      ...result.accepted,
      ...this.condition.replayConditionSelection(
        multiple,
        required,
        valueLabel,
      ),
    };

    result.markdown += `\n${
      this.selectableValues(selectable, prefix, valueLabel).markdown
    }`;

    result.markdown += this.howManySelectionsMd(multiple);

    result.keyboard = this.keyboard.selection(
      result.keyboard,
      range(1, Object.keys(valueLabel).length).map(String),
    );

    this.answerOptionsMdKeyboard(
      result,
      selectable,
      prefix,
      multiple,
      required,
    );

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
   * Render a callout response slide or nestable component and each nested component in Markdown
   * @param nestable The nestable component or slide to render
   * @param prefix The prefix, used to group the answers later (only used for slides)
   */
  public nestableComponent(
    nestable: CalloutComponentNestableSchema | CalloutSlideSchema,
    prefix: string,
  ) {
    const nestableResults: Render[] = [];

    for (const component of nestable.components) {
      const componentRenders = this.component(component, prefix);
      nestableResults.push(...componentRenders);
    }

    return nestableResults;
  }

  public component(component: CalloutComponentSchema, prefix: string) {
    const results: Render[] = [];

    if (isCalloutComponentOfType(component, CalloutComponentType.CONTENT)) {
      results.push(this.contentComponent(component, prefix));
      return results;
    }

    if (isCalloutComponentOfType(component, CalloutComponentType.INPUT_FILE)) {
      results.push(this.inputFileComponent(component, prefix));
      return results;
    }

    if (
      isCalloutComponentOfType(component, CalloutComponentType.INPUT_SIGNATURE)
    ) {
      results.push(this.inputSignatureComponent(component, prefix));
      return results;
    }

    if (
      isCalloutComponentOfType(component, CalloutComponentType.INPUT_SELECT)
    ) {
      results.push(this.selectComponent(component, prefix));
      return results;
    }

    if (
      isCalloutComponentOfType(component, CalloutComponentType.INPUT_CHECKBOX)
    ) {
      results.push(this.inputCheckboxComponent(component, prefix));
      return results;
    }

    if (
      isCalloutComponentOfBaseType(
        component,
        CalloutComponentBaseType.INPUT_SELECTABLE,
      )
    ) {
      results.push(this.selectableComponent(component, prefix));
      return results;
    }

    if (
      isCalloutComponentOfBaseType(component, CalloutComponentBaseType.NESTABLE)
    ) {
      results.push(...this.nestableComponent(component, prefix));
      return results;
    }

    if (
      isCalloutComponentOfBaseType(component, CalloutComponentBaseType.INPUT)
    ) {
      results.push(this.inputComponent(component, prefix));
      return results;
    }

    console.warn("Rendering unknown component", component, prefix);
    const multiple = this.isMultiple(component);
    const unknown: Render = {
      key: createCalloutGroupKey(
        (component as CalloutComponentSchema).key,
        prefix,
      ),
      type: RenderType.MARKDOWN,
      accepted: this.condition.replayConditionAny(
        multiple,
        (component as CalloutComponentSchema).validate?.required || false,
      ),
      markdown: this.i18n.t("bot.response.messages.componentUnknown", {
        type: (component as CalloutComponentSchema).type || "undefined",
      }),
      parseType: calloutComponentTypeToParsedResponseType(component),
      removeKeyboard: true,
    };
    results.push(unknown);

    return results;
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
      removeKeyboard: true,
    };
    result.html = `${sanitizeHtml(callout.intro)}`;

    const continueKeyboard = this.keyboard.inlineContinueCancel(
      `${BUTTON_CALLBACK_CALLOUT_PARTICIPATE}:${callout.slug}`,
    );
    result.inlineKeyboard = continueKeyboard;

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
      removeKeyboard: true,
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
  public full(callout: GetCalloutDataWithExt<"form">) {
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

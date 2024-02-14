import { Singleton } from "../deps.ts";
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
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { ConditionService } from "../services/condition.service.ts";
import { MessageRenderer } from "./message.renderer.ts";
import {
  BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
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
    protected readonly i18n: I18nService,
  ) {
    console.debug(`${this.constructor.name} created`);
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

    const placeholder = input.placeholder as string | undefined;

    if (placeholder) {
      result.markdown = `_${
        escapeMd(this.i18n.t("bot.info.messages.placeholder", { placeholder }))
      }_`;
    }

    return result;
  }

  protected multipleMd(component: BaseCalloutComponentSchema, prefix: string) {
    const doneMessage = this.i18n.t("bot.reactions.messages.done");
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
          `${this.i18n.t("bot.info.messages.multipleValuesAllowed")}\n\n${
            this.messageRenderer.writeDoneMessage(doneMessage).text
          }`,
        )
      }_`;
    } else {
      result.markdown += `_${
        escapeMd(
          `${this.i18n.t("bot.info.messages.onlyOneValueAllowed")}\n\n${
            this.messageRenderer.writeDoneMessage(doneMessage).text
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
        multiple ? [this.i18n.t("bot.reactions.messages.done")] : [],
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
        multiple ? [this.i18n.t("bot.reactions.messages.done")] : [],
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
          ? this.i18n.t("bot.info.messages.uploadFilesHere")
          : this.i18n.t("bot.info.messages.uploadFileHere"),
      )
    }_`;

    result.accepted = this.condition.replayConditionFilePattern(
      multiple,
      // TODO: Fix `filePattern` property in common types
      file.filePattern || file.type as unknown === "signature" ? "image/*" : "",
      multiple ? [this.i18n.t("bot.reactions.messages.done")] : [],
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
              ? this.i18n.t("bot.info.messages.multipleAddressesAllowed")
              : this.i18n.t("bot.info.messages.onlyOneAddressAllowed"),
          )
        }_`;
        break;
      }
      case "button": {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.response.messages.componentNotSupported", {
              type: "button input component",
            }),
          )
        }_`;
        break;
      }
      case "checkbox": {
        const truthyMessage = this.i18n.t("bot.reactions.messages.truthy");
        const falsyMessage = this.i18n.t("bot.reactions.messages.falsy");
        const doneMessage = this.i18n.t("bot.reactions.messages.done");

        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.response.messages.answerWithTruthyOrFalsy", {
              truthy: truthyMessage,
              falsy: falsyMessage,
            }),
          )
        }_`;
        result.accepted = this.condition.replayConditionText(
          result.accepted.multiple,
          [truthyMessage, falsyMessage],
          result.accepted.multiple ? [doneMessage] : [],
        );
        break;
      }
      case "email": {
        result.markdown += `_${
          escapeMd(
            result.accepted.multiple
              ? this.i18n.t("bot.info.messages.multipleEmailsAllowed")
              : this.i18n.t("bot.info.messages.onlyOneEmailAllowed"),
          )
        }_`;
        break;
      }
      case "number": {
        result.markdown += `_${
          escapeMd(
            result.accepted.multiple
              ? this.i18n.t("bot.info.messages.multipleNumbersAllowed")
              : this.i18n.t("bot.info.messages.onlyOneNumberAllowed"),
          )
        }_`;
        break;
      }
      case "password": {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterPassword"),
          )
        }_`;
        break;
      }
      case "textfield": {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterText"),
          )
        }_`;
        break;
      }
      case "textarea": {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterLotsOfText"),
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "content" as unknown: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterContent"),
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "phoneNumber" as unknown: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterTelephoneNumber"),
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "currency" as unknown: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterAmountOfMoney"),
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "datetime" as unknown: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterDate"),
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "time" as unknown: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterTime"),
          )
        }_`;
        break;
      }
      // TODO: Missing in common types
      case "url" as unknown: {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.enterUrl"),
          )
        }_`;
        break;
      }

      default: {
        result.markdown += this.i18n.t("bot.response.messages.componentUnknown", {
          type: (input as InputCalloutComponentSchema).type || "undefined",
        });
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
        multiple ? [this.i18n.t("bot.reactions.messages.done")] : [],
      ),
    };

    result.markdown += `\n${this.radioValues(radio, prefix).markdown}`;

    result.markdown += `\n\n`;

    switch (radio.type) {
      case "radio": {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.onlyOneSelectionAllowed"),
          )
        }_`;
        break;
      }
      case "selectboxes": {
        result.markdown += `_${
          escapeMd(
            this.i18n.t("bot.info.messages.multipleSelectionsAllowed") + "\n\n" +
              this.messageRenderer.writeDoneMessage(
                this.i18n.t("bot.reactions.messages.done"),
              ).text,
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
        this.i18n.t("bot.info.messages.onlyOneSelectionAllowed"),
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
          markdown: this.i18n.t("bot.response.messages.componentUnknown", {
            type: (component as CalloutComponentSchema).type || "undefined",
          }),
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

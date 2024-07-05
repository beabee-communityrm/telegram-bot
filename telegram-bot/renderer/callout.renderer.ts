import { InputFile, InputMediaBuilder, Singleton } from "../deps/index.ts";
import { downloadImage, escapeMd, sanitizeHtml } from "../utils/index.ts";
import { ParsedResponseType, RenderType } from "../enums/index.ts";
import {
  INLINE_BUTTON_CALLBACK_CALLOUT_LIST,
  INLINE_BUTTON_CALLBACK_CALLOUT_PARTICIPATE,
} from "../constants/index.ts";

import { ConditionService } from "../services/condition.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";

import type {
  GetCalloutDataExt,
  GetCalloutDataWithExt,
  Render,
} from "../types/index.ts";

import type { Paginated } from "../deps/index.ts";

/**
 * Render callouts for Telegram in Markdown
 */
@Singleton()
export class CalloutRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
    protected readonly condition: ConditionService,
    protected readonly i18n: I18nService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Renders a start response keyboard for a callout
   * @fires `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_CALLOUT_PARTICIPATE}`
   *
   * @param callout
   * @returns
   */
  public startResponseKeyboard(
    callout: GetCalloutDataExt,
  ): Render {
    const keyboardMessageMd = `_${
      escapeMd(this.i18n.t("bot.response.messages.calloutStartResponse"))
    }_`;
    const yesNoInlineKeyboard = this.keyboard.inlineYesNo(
      `${INLINE_BUTTON_CALLBACK_CALLOUT_PARTICIPATE}:${callout.id}`,
    );

    const result: Render = {
      key: `callout:start-response:${callout.id}`,
      type: RenderType.MARKDOWN,
      markdown: keyboardMessageMd,
      inlineKeyboard: yesNoInlineKeyboard,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
    return result;
  }

  /**
   * Renders a list callouts keyboard
   * @fires `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_CALLOUT_LIST}`
   */
  public listCalloutsKeyboard(): Render {
    const keyboardMessageMd = `_${
      escapeMd(this.i18n.t("bot.response.messages.calloutList"))
    }_`;
    const yesNoInlineKeyboard = this.keyboard.inlineYesNo(
      INLINE_BUTTON_CALLBACK_CALLOUT_LIST,
    );

    const result: Render = {
      key: `callout:callouts-list`,
      type: RenderType.MARKDOWN,
      markdown: keyboardMessageMd,
      inlineKeyboard: yesNoInlineKeyboard,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };
    return result;
  }

  /**
   * Render a single callout line item in Markdown
   * @param callout
   * @param listChar
   * @returns
   */
  public listItem(callout: GetCalloutDataExt, listChar = "\\-") {
    listChar = escapeMd(listChar);

    const result: Render = {
      key: `callout:list:${callout.id}`,
      type: RenderType.MARKDOWN,
      markdown: `${listChar} ${this.title(callout).markdown}\n`,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    return result;
  }

  /**
   * Render a list of callouts in Markdown
   * @param callouts
   * @returns
   */
  public listItems(
    callouts: Paginated<GetCalloutDataExt>,
  ) {
    const listResult: Render = {
      key: "callout:list",
      type: RenderType.MARKDOWN,
      markdown: "",
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    if (callouts.items.length === 0) {
      listResult.markdown = escapeMd(
        this.i18n.t("bot.response.messages.noActiveCallouts"),
      );
      return [listResult];
    }

    listResult.markdown = `*${
      escapeMd(this.i18n.t("bot.render.callout.list.title"))
    }*\n\n`;
    let p = 1;
    for (const callout of callouts.items) {
      listResult.markdown += `${this.listItem(callout, `${p}.`).markdown}`;
      p++;
    }

    const inlineKeyboard = this.keyboard.inlineCalloutSelection(callouts.items);
    const keyboardMessageMd = `_${
      escapeMd(this.i18n.t("bot.keyboard.message.select-detail-callout"))
    }_`;

    const keyboardResult: Render = {
      key: "callout:list:keyboard",
      type: RenderType.MARKDOWN,
      markdown: keyboardMessageMd,
      inlineKeyboard,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    return [listResult, keyboardResult];
  }

  /**
   * Render a callout title in Markdown
   * @param callout The callout to render
   * @param withUrl Whether to include the URL in the title
   * @returns
   */
  public title(callout: GetCalloutDataExt, withUrl = true) {
    const result: Render = {
      key: `callout:title:${callout.id}`,
      type: RenderType.MARKDOWN,
      markdown: "",
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    const title = escapeMd(callout.title);

    if (withUrl && callout.url) {
      result.markdown = `*[${title}](${callout.url})*`;
    } else {
      result.markdown = `*${title}*`;
    }

    return result;
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
      forceReply: false,
    };
    result.html = `${sanitizeHtml(callout.intro)}`;
    return result;
  }

  /**
   * Render a callout with photo.
   *
   * @param callout
   * @returns
   */
  public async calloutDetails(callout: GetCalloutDataExt) {
    const imagePath = await downloadImage(callout.image);
    const inputFile = new InputFile(await Deno.open(imagePath), callout.title);

    // TODO: Add URL to callout
    let captionMd = this.title(callout).markdown;
    captionMd += `\n\n${escapeMd(callout.excerpt)}`;
    const calloutImage = InputMediaBuilder.photo(inputFile, {
      caption: captionMd,
      parse_mode: "MarkdownV2",
    });

    const calloutResult: Render = {
      key: `callout:photo:${callout.id}`,
      type: RenderType.PHOTO,
      photo: calloutImage,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
    };

    return calloutResult;
  }
}

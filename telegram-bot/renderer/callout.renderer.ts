import { InputFile, InputMediaBuilder, Singleton } from "../deps/index.ts";
import { downloadImage, escapeMd } from "../utils/index.ts";
import { ParsedResponseType, RenderType } from "../enums/index.ts";
import { BUTTON_CALLBACK_CALLOUT_INTRO } from "../constants/index.ts";

import { ConditionService } from "../services/condition.service.ts";
import { KeyboardService } from "../services/keyboard.service.ts";
import { I18nService } from "../services/i18n.service.ts";

import type {
  CalloutDataExt,
  GetCalloutDataExt,
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
   * @fires `callback_query:data:${BUTTON_CALLBACK_CALLOUT_INTRO}`
   *
   * @param callout
   * @returns
   */
  protected startResponseKeyboard(
    callout: CalloutDataExt,
  ): Render {
    const keyboardMessageMd = `_${
      escapeMd(this.i18n.t("bot.response.messages.calloutStartResponse"))
    }_`;
    const yesNoInlineKeyboard = this.keyboard.inlineYesNo(
      `${BUTTON_CALLBACK_CALLOUT_INTRO}:${callout.shortSlug}`,
    );

    const result: Render = {
      key: `callout:start-response:${callout.shortSlug}`,
      type: RenderType.MARKDOWN,
      markdown: keyboardMessageMd,
      inlineKeyboard: yesNoInlineKeyboard,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };
    return result;
  }

  /**
   * Render a single callout line item in Markdown
   * @param callout
   * @param listChar
   * @returns
   */
  public listItem(callout: CalloutDataExt, listChar = "\\-") {
    listChar = escapeMd(listChar);

    const result: Render = {
      key: `callout:list:${callout.shortSlug}`,
      type: RenderType.MARKDOWN,
      markdown: `${listChar} ${this.title(callout).markdown}\n`,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
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
      removeKeyboard: true,
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
      removeKeyboard: true,
    };

    return [listResult, keyboardResult];
  }

  /**
   * Render a callout title in Markdown
   * @param callout The callout to render
   * @param withUrl Whether to include the URL in the title
   * @returns
   */
  public title(callout: CalloutDataExt, withUrl = true) {
    const result: Render = {
      key: `callout:title:${callout.shortSlug}`,
      type: RenderType.MARKDOWN,
      markdown: "",
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
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
   * Render a callout with photo.
   *
   * @param callout
   * @returns
   */
  public async calloutDetails(callout: CalloutDataExt) {
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
      key: `callout:photo:${callout.shortSlug}`,
      type: RenderType.PHOTO,
      photo: calloutImage,
      accepted: this.condition.replayConditionNone(),
      parseType: ParsedResponseType.NONE,
      removeKeyboard: true,
    };

    const keyboardResult = this.startResponseKeyboard(callout);

    return [calloutResult, keyboardResult];
  }
}

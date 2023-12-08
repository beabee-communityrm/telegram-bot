import { Singleton } from "alosaur/mod.ts";
import { downloadImage, escapeMd } from "../utils/index.ts";
import { InputFile, InputMediaBuilder } from "grammy/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { KeyboardService } from "../services/index.ts";
import { BUTTON_CALLBACK_CALLOUT_INTRO } from "../constants/index.ts";

import type {
  CalloutDataExt,
  GetCalloutDataExt,
  Paginated,
  RenderResult,
} from "../types/index.ts";

/**
 * Render callouts for Telegram in Markdown
 */
@Singleton()
export class CalloutRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
  ) {
    console.debug(`${CalloutRenderer.name} created`);
  }

  /**
   * @fires `callback_query:data:${BUTTON_CALLBACK_CALLOUT_INTRO}`
   *
   * @param callout
   * @returns
   */
  protected startResponseKeyboard(callout: CalloutDataExt) {
    const keyboardMessageMd = `_${
      escapeMd("Would you like to respond to the callout?")
    }_`;
    const yesNoKeyboard = this.keyboard.yesNo(
      `${BUTTON_CALLBACK_CALLOUT_INTRO}:${callout.shortSlug}`,
    );

    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: keyboardMessageMd,
      keyboard: yesNoKeyboard,
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

    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: `${listChar} ${this.title(callout).markdown}\n`,
    };

    return result;
  }

  /**
   * Render a list of callouts in Markdown
   * @param callouts
   * @returns
   */
  public listItems(callouts: Paginated<GetCalloutDataExt>) {
    const listResult: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: "",
    };

    if (callouts.items.length === 0) {
      listResult.markdown = escapeMd("There are currently no active callouts");
      return listResult;
    }

    listResult.markdown = `*${escapeMd("List of active callouts")}*\n\n`;
    let p = 1;
    for (const callout of callouts.items) {
      listResult.markdown += `${this.listItem(callout, `${p}.`).markdown}`;
      p++;
    }

    const keyboard = this.keyboard.calloutSelection(callouts.items);
    const keyboardMessageMd = `_${
      escapeMd(
        "Which callout would you like to get more information displayed about? Choose a number",
      )
    }_`;

    const keyboardResult: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: keyboardMessageMd,
      keyboard,
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
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: "",
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
   * Render a callout as a photo.
   *
   * @param callout
   * @returns
   */
  public async callout(callout: CalloutDataExt) {
    const imagePath = await downloadImage(callout.image);
    const inputFile = new InputFile(await Deno.open(imagePath), callout.title);

    // TODO: Add URL to callout
    let captionMd = this.title(callout).markdown;
    captionMd += `\n\n${escapeMd(callout.excerpt)}`;
    const calloutImage = InputMediaBuilder.photo(inputFile, {
      caption: captionMd,
      parse_mode: "MarkdownV2",
    });

    const calloutResult: RenderResult = {
      type: RenderResultType.PHOTO,
      photo: calloutImage,
    };

    const keyboardResult = this.startResponseKeyboard(callout);

    return [calloutResult, keyboardResult];
  }
}

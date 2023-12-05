import { Singleton } from "alosaur/mod.ts";
import { downloadImage, escapeMd } from "../utils/index.ts";
import { InputFile, InputMediaBuilder } from "grammy/mod.ts";
import { RenderResultType } from "../enums/index.ts";
import { KeyboardService } from "../services/index.ts";

import type { CalloutDataExt, RenderResult } from "../types/index.ts";

/**
 * Render callouts for Telegram in Markdown
 */
@Singleton()
export class CalloutRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
  ) {}

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
  public listItems(callouts: CalloutDataExt[]) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: "",
    };
    if (callouts.length === 0) {
      result.markdown = escapeMd("There are currently no active callouts");
      return result;
    }

    result.markdown = `*${escapeMd("List of active callouts")}*\n\n`;
    let p = 1;
    for (const callout of callouts) {
      result.markdown += `${this.listItem(callout, `${p}.`).markdown}`;
      p++;
    }

    return result;
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
   * Render a callout as a photo
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

    const result: RenderResult = {
      type: RenderResultType.PHOTO,
      photo: calloutImage,
    };

    return result;
  }
}

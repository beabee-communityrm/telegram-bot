import { Singleton } from "alosaur/mod.ts";
import { escapeMd, sanitizeHtml } from "../utils/index.ts";
import { RenderResultType } from "../enums/index.ts";
import { KeyboardService } from "../services/index.ts";
import { BUTTON_CALLBACK_CALLOUT_PARTICIPATE } from "../constants.ts";

import type { CalloutSlideSchema } from "@beabee/beabee-common";
import type { GetCalloutDataWithExt, RenderResult } from "../types/index.ts";

/**
 * Render callout responses for Telegram in Markdown
 */
@Singleton()
export class CalloutResponseRenderer {
  constructor(
    protected readonly keyboard: KeyboardService,
  ) { }

  protected title(title: string, url?: string) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: `*${escapeMd(title)}*`,
    };

    if (url) {
      result.markdown = `*[${result.markdown}](${url})*`;
    } else {
      result.markdown = `*${result.markdown}*`;
    }

    return result;
  }

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

  protected slideComponent(slide: CalloutSlideSchema) {
  }

  protected slide(slide: CalloutSlideSchema) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: this.title(slide.title).markdown,
    };
  }

  /**
   * Render a callout response in Markdown
   * @param callout The callout to render
   * @param slideNum The slide number to render
   * @returns
   */
  public response(callout: GetCalloutDataWithExt<"form">, slideNum: number) {
    const result: RenderResult = {
      type: RenderResultType.MARKDOWN,
      markdown: "TODO",
    };

    // TODO: Render form / slide
    const form = callout.formSchema;
    const slide = form.slides[slideNum];

    console.debug("Rendering slide", slide);

    return result;
  }
}

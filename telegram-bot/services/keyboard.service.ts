import { Singleton } from "alosaur/mod.ts";
import { InlineKeyboard } from "grammy/mod.ts";
import { BUTTON_CALLBACK_SHOW_CALLOUT } from "../constants.ts";

import type { CalloutDataExt } from "../types/index.ts";

/**
 * Service to create Telegram keyboard buttons
 */
@Singleton()
export class KeyboardService {
  constructor() {
    console.debug(`${KeyboardService.name} created`);
  }

  /**
   * Create a keyboard button to select a callout.
   *
   * To respond to the button press, listen for the `callback_query:data:show-callout-slug` event using the EventService.
   *
   * @param callouts The callouts to select from
   * @param startIndex The index of the first callout to show, starting at 1
   * @param endIndex The index of the last callout to show, starting at 1 and must be larger than startIndex
   */
  public calloutSelection(
    callouts: CalloutDataExt[],
    startIndex = 1,
    endIndex = callouts.length,
  ) {
    const inlineKeyboard = new InlineKeyboard();
    if (startIndex < 1) {
      throw new Error("startIndex must be larger than 0");
    }
    if (endIndex < startIndex) {
      throw new Error("endIndex must be larger than startIndex");
    }
    if (endIndex > callouts.length) {
      throw new Error("endIndex is larger than callouts.length");
    }
    for (let i = startIndex; i <= endIndex; i++) {
      inlineKeyboard.text(
        `${i}`,
        `${BUTTON_CALLBACK_SHOW_CALLOUT}:${callouts[i - 1].slug}`,
      );
    }
    return inlineKeyboard;
  }

  /**
   * Create a keyboard with Yes and No buttons.
   *
   * To respond to the button press, listen for the `callback_query:data:yes` and `callback_query:data:no` events using the EventService.
   * If you have defined a prefix, the event names will be prefixed with the prefix, e.g. `callback_query:data:callout-respond:yes`.
   *
   * @param prefix A prefix to add to the button data, e.g. "callout-respond"
   */
  public yesNo(prefix = "") {
    const inlineKeyboard = new InlineKeyboard();
    inlineKeyboard.text("Yes", prefix ? `${prefix}:yes` : `yes`);
    inlineKeyboard.text("No", prefix ? `${prefix}:no` : `no`);
    return inlineKeyboard;
  }

  /**
   * Create a keyboard with Continue and Cancel buttons.
   *
   * To respond to the button press, listen for the `callback_query:data:continue` and `callback_query:data:cancel` events using the EventService.
   * If you have defined a prefix, the event names will be prefixed with the prefix, e.g. `callback_query:data:callout-respond:continue`.
   *
   * @param prefix A prefix to add to the button data, e.g. "callout-respond"
   */
  public continueCancel(prefix = "") {
    const inlineKeyboard = new InlineKeyboard();
    inlineKeyboard.text("Continue", prefix ? `${prefix}:continue` : `continue`);
    inlineKeyboard.text("Cancel", prefix ? `${prefix}:cancel` : `cancel`);
    return inlineKeyboard;
  }
}

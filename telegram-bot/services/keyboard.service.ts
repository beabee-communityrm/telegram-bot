import { BaseService } from "../core/index.ts";
import { InlineKeyboard, Keyboard, Singleton } from "../deps/index.ts";
import { BUTTON_CALLBACK_SHOW_CALLOUT } from "../constants/index.ts";
import { I18nService } from "./i18n.service.ts";

import type { AppContext, CalloutDataExt } from "../types/index.ts";

/**
 * Service to create Telegram keyboard buttons
 */
@Singleton()
export class KeyboardService extends BaseService {
  constructor(protected readonly i18n: I18nService) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Create a new empty keyboard
   * @returns
   */
  public empty() {
    return new Keyboard();
  }

  /**
   * Create a new empty inline keyboard
   * @returns
   */
  public inlineEmpty() {
    return new InlineKeyboard();
  }

  /**
   * Create a keyboard button to select a callout.
   *
   * To respond to the button press, listen for the `callback_query:data:show-callout-slug` event using the EventService.
   *
   * @fires `callback_query:data:${BUTTON_CALLBACK_SHOW_CALLOUT}`
   *
   * @param callouts The Callouts to select from
   * @param startIndex The index of the first callout to show, starting at 1
   * @param endIndex The index of the last callout to show, starting at 1 and must be larger than startIndex
   */
  public inlineCalloutSelection(
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
      const shortSlug = callouts[i - 1].shortSlug;
      if (!shortSlug) {
        console.error(
          `Callout ${i} has no slug.\nSkipping...`,
        );
        continue;
      }
      const callbackData = `${BUTTON_CALLBACK_SHOW_CALLOUT}:${shortSlug}`;

      if (callbackData.length > 64) {
        console.error(
          `Error: Callout ${i} has a slug that is too long: "${callbackData}".\nSkipping...`,
        );
        continue;
      }

      inlineKeyboard.text(
        `${i}`,
        callbackData,
      );
    }
    return inlineKeyboard;
  }

  /**
   * Create a keyboard with a list of selections
   * @param keyboard
   * @param selections
   * @returns
   */
  public selection(keyboard = new Keyboard(), selections: string[]) {
    for (const selection of selections) {
      keyboard.text(selection);
    }
    return keyboard.row();
  }

  /**
   * Create a inline keyboard with Yes and No buttons.
   *
   * To respond to the button press, listen for the `callback_query:data:yes` and `callback_query:data:no` events using the EventService.
   * If you have defined a prefix, the event names will be prefixed with the prefix, e.g. `callback_query:data:callout-respond:yes`.
   *
   * @param ctx The chat context
   * @param prefix A prefix to add to the button data, e.g. "callout-respond"
   */
  public inlineYesNo(
    prefix: string,
    truthyLabel = this.i18n.t("bot.reactions.messages.truthy"),
    falsyLabel = this.i18n.t("bot.reactions.messages.falsy"),
  ) {
    const inlineKeyboard = new InlineKeyboard();
    inlineKeyboard.text(
      truthyLabel,
      prefix ? `${prefix}:yes` : `yes`,
    );
    inlineKeyboard.text(
      falsyLabel,
      prefix ? `${prefix}:no` : `no`,
    );
    return inlineKeyboard;
  }

  /**
   * Creates or extends a custom keyboard with Yes and No buttons.
   *
   * @param keyboard The keyboard to extend
   * @param truthyLabel The label for the truthy button
   * @param falsyLabel The label for the falsy button
   */
  public yesNo(
    keyboard = new Keyboard(),
    truthyLabel = this.i18n.t("bot.reactions.messages.truthy"),
    falsyLabel = this.i18n.t("bot.reactions.messages.falsy"),
  ) {
    return keyboard.text(truthyLabel).text(falsyLabel).row();
  }

  /**
   * Creates a extends a custom keyboard with a skip button.
   *
   * @param keyboard The keyboard to extend
   * @param skipLabel The label for the skip button
   */
  public skip(
    keyboard = new Keyboard(),
    skipLabel = this.i18n.t("bot.reactions.messages.skip"),
  ) {
    return keyboard.text(skipLabel).row();
  }

  /**
   * Creates a extends a custom keyboard with a done button.
   *
   * @param keyboard The keyboard to extend
   * @param doneLabel The label for the done button
   */
  public done(
    keyboard = new Keyboard(),
    skipLabel = this.i18n.t("bot.reactions.messages.done"),
  ) {
    return keyboard.text(skipLabel).row();
  }

  /**
   * Create a keyboard for a callout response
   * @param keyboard The keyboard to extend
   * @param required
   * @param multiple
   */
  public skipDone(
    keyboard = new Keyboard(),
    required = false,
    multiple = false,
  ) {
    if (multiple) {
      this.done(keyboard);
    }

    if (!required) {
      this.skip(keyboard);
    }

    return keyboard;
  }

  /**
   * Create a inline keyboard with Continue and Cancel buttons.
   *
   * To respond to the button press, listen for the `callback_query:data:continue` and `callback_query:data:cancel` events using the EventService.
   * If you have defined a prefix, the event names will be prefixed with the prefix, e.g. `callback_query:data:callout-respond:continue`.
   *
   * @param prefix A prefix to add to the button data, e.g. "callout-respond"
   */
  public inlineContinueCancel(prefix = "") {
    const inlineKeyboard = new InlineKeyboard();
    inlineKeyboard.text(
      this.i18n.t("bot.keyboard.label.continue"),
      prefix ? `${prefix}:continue` : `continue`,
    );
    inlineKeyboard.text(
      this.i18n.t("bot.keyboard.label.cancel"),
      prefix ? `${prefix}:cancel` : `cancel`,
    );
    return inlineKeyboard;
  }

  /**
   * Create a keyboard with Continue and Cancel buttons.
   */
  public continueCancel() {
    const keyboard = new Keyboard()
      .text(
        this.i18n.t("bot.keyboard.label.continue"),
      )
      .row()
      .text(
        this.i18n.t("bot.keyboard.label.cancel"),
      ).oneTime();

    return keyboard;
  }

  /**
   * Remove an existing inline keyboard
   * @param ctx The chat context
   * @param withMessage If true, the message will be deleted, too
   */
  public async removeInlineKeyboard(ctx: AppContext, withMessage = false) {
    // Do not delete keyboard message?
    if (!withMessage) {
      const inlineKeyboard = new InlineKeyboard();
      return await ctx.editMessageReplyMarkup({
        reply_markup: inlineKeyboard,
      });
    }

    return await ctx.deleteMessage();
  }

  public async removeLastInlineKeyboard(ctx: AppContext) {
    const session = await ctx.session;
    if (!session) {
      throw new Error("ctx with a session is required when once is true");
    }
    const inlineKeyboardData = session._data.latestKeyboard;
    if (!inlineKeyboardData || !Object.keys(inlineKeyboardData).length) {
      console.debug("No inline keyboard to remove");
      return;
    }

    if (inlineKeyboardData.message_id && inlineKeyboardData.chat_id) {
      await ctx.api.editMessageReplyMarkup(
        inlineKeyboardData.chat_id,
        inlineKeyboardData.message_id,
        {
          reply_markup: new InlineKeyboard(),
        },
      );
    }
  }
}

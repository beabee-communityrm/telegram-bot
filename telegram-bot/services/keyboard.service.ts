import { BaseService } from "../core/index.ts";
import { InlineKeyboard, Keyboard, Singleton } from "../deps/index.ts";
import {
  FALSY_MESSAGE_KEY,
  INLINE_BUTTON_CALLBACK_SHOW_CALLOUT,
  TRUTHY_MESSAGE_KEY,
} from "../constants/index.ts";
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
   * Create a new empty custom keyboard
   * @returns
   */
  public empty(
    options: { isOneTime: boolean; isPersistent: boolean; isResized: boolean } =
      { isOneTime: true, isPersistent: false, isResized: true },
  ) {
    return new Keyboard().oneTime(options.isOneTime).persistent(
      options.isPersistent,
    ).resized(options.isResized);
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
   * To respond to the button press, listen for the `${INLINE_BUTTON_CALLBACK_PREFIX}:show-callout-slug` event using the EventService.
   *
   * @fires `${INLINE_BUTTON_CALLBACK_PREFIX}:${INLINE_BUTTON_CALLBACK_SHOW_CALLOUT}`
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
      const callbackData =
        `${INLINE_BUTTON_CALLBACK_SHOW_CALLOUT}:${shortSlug}`;

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
   * Create or extends a custom keyboard with a list of selections
   * @param keyboard
   * @param selections
   * @returns
   */
  public selection(keyboard = this.empty(), selections: string[]) {
    for (const selection of selections) {
      keyboard.text(selection);
    }
    return keyboard.row();
  }

  /**
   * Create or extends a inline keyboard with a list of selections
   * @param prefix A prefix to add to the button data, used to subscribe to the events
   * @param keyboard The inline keyboard to extend
   * @param selections The selections to add
   * @returns
   */
  public inlineSelection(
    prefix: string,
    keyboard = this.inlineEmpty(),
    selections: string[],
  ) {
    for (const selection of selections) {
      keyboard.text(selection, `${prefix}:${selection}`);
    }
    return keyboard.row();
  }

  /**
   * Create a inline keyboard with Yes and No buttons.
   *
   * To respond to the button press, listen for the `${INLINE_BUTTON_CALLBACK_PREFIX}:yes` and `${INLINE_BUTTON_CALLBACK_PREFIX}:no` events using the EventService.
   * If you have defined a prefix, the event names will be prefixed with the prefix, e.g. `${INLINE_BUTTON_CALLBACK_PREFIX}:callout-respond:yes`.
   *
   * @param ctx The chat context
   * @param prefix A prefix to add to the button data, e.g. "callout-respond"
   * @param keyboard The keyboard to extend
   * @param truthyLabel The label for the truthy button
   * @param falsyLabel The label for the falsy button
   */
  public inlineYesNo(
    prefix: string,
    keyboard = this.inlineEmpty(),
    truthyLabel = this.i18n.t("bot.reactions.messages.truthy"),
    falsyLabel = this.i18n.t("bot.reactions.messages.falsy"),
    truthyMessageKey = TRUTHY_MESSAGE_KEY,
    falsyMessageKey = FALSY_MESSAGE_KEY,
  ) {
    keyboard.text(
      truthyLabel,
      prefix ? `${prefix}:${truthyMessageKey}` : `${truthyMessageKey}`,
    );
    keyboard.text(
      falsyLabel,
      prefix ? `${prefix}:${falsyMessageKey}` : `${falsyMessageKey}`,
    );
    return keyboard;
  }

  /**
   * Creates or extends a custom keyboard with Yes and No buttons.
   *
   * @param keyboard The keyboard to extend
   * @param truthyLabel The label for the truthy button
   * @param falsyLabel The label for the falsy button
   */
  public yesNo(
    keyboard = this.empty(),
    truthyLabel = this.i18n.t("bot.reactions.messages.truthy"),
    falsyLabel = this.i18n.t("bot.reactions.messages.falsy"),
  ) {
    return keyboard.text(truthyLabel).text(falsyLabel).row();
  }

  /**
   * Creates or extends a custom keyboard with a skip button.
   *
   * @param keyboard The keyboard to extend
   * @param skipLabel The label for the skip button
   */
  public skip(
    keyboard = this.empty(),
    skipLabel = this.i18n.t("bot.reactions.messages.skip"),
  ) {
    return keyboard.text(skipLabel).row();
  }

  /**
   * Creates or extends a inline keyboard with a skip button.
   *
   * @param prefix A prefix to add to the button data, used to subscribe to the events
   * @param keyboard The keyboard to extend
   * @param skipLabel The label for the skip button
   */
  public inlineSkip(
    prefix: string,
    keyboard = this.inlineEmpty(),
    skipLabel = this.i18n.t("bot.reactions.messages.skip"),
  ) {
    return keyboard.text(skipLabel, `${prefix}:skip`).row();
  }

  /**
   * Creates or extends a custom keyboard with a done button.
   *
   * @param keyboard The keyboard to extend
   * @param doneLabel The label for the done button
   */
  public done(
    keyboard = this.empty(),
    doneLabel = this.i18n.t("bot.reactions.messages.done"),
  ) {
    return keyboard.text(doneLabel).row();
  }

  /**
   * Creates or extends a inline keyboard with a done button.
   *
   * @param prefix A prefix to add to the button data, used to subscribe to the events
   * @param keyboard The keyboard to extend
   * @param doneLabel The label for the done button
   */
  public inlineDone(
    prefix: string,
    keyboard = this.inlineEmpty(),
    doneLabel = this.i18n.t("bot.reactions.messages.done"),
  ) {
    return keyboard.text(doneLabel, `${prefix}:done`).row();
  }

  /**
   * Create a keyboard for a callout response
   * @param keyboard The keyboard to extend
   * @param required
   * @param multiple
   */
  public skipDone(
    keyboard = this.empty(),
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
   * Create a inline keyboard for a callout response
   * @param keyboard The keyboard to extend
   * @param required
   * @param multiple
   */
  public inlineSkipDone(
    prefix: string,
    keyboard = this.inlineEmpty(),
    required = false,
    multiple = false,
  ) {
    if (multiple) {
      this.inlineDone(prefix, keyboard);
    }

    if (!required) {
      this.inlineSkip(prefix, keyboard);
    }

    console.debug(`inlineSkipDone: ${prefix}`);

    return keyboard;
  }

  /**
   * Create a inline keyboard with Continue and Cancel buttons.
   *
   * To respond to the button press, listen for the `${INLINE_BUTTON_CALLBACK_PREFIX}:continue` and `${INLINE_BUTTON_CALLBACK_PREFIX}:cancel` events using the EventService.
   * If you have defined a prefix, the event names will be prefixed with the prefix, e.g. `${INLINE_BUTTON_CALLBACK_PREFIX}:callout-respond:continue`.
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
    const keyboard = this.empty()
      .text(
        this.i18n.t("bot.keyboard.label.continue"),
      )
      .row()
      .text(
        this.i18n.t("bot.keyboard.label.cancel"),
      );

    return keyboard;
  }

  /**
   * Remove an existing inline keyboard
   * @param ctx The chat context
   * @param withMessage If true, the attached message will be deleted, too
   */
  public async removeInlineKeyboard(ctx: AppContext, withMessage = false) {
    try {
      // Do not remove attached message?
      if (!withMessage) {
        const inlineKeyboard = new InlineKeyboard();
        console.debug("ctx.update", JSON.stringify(ctx.update, null, 2));
        if (!ctx.update.callback_query?.message?.reply_markup) {
          console.warn("No keyboard to remove");
          return;
        }
        return await ctx.editMessageReplyMarkup({
          reply_markup: inlineKeyboard,
        });
      }

      return await ctx.deleteMessage();
    } catch (error) {
      console.error("Error removing inline keyboard", error);
    }
  }

  public async removeLastInlineKeyboard(ctx: AppContext) {
    const session = await ctx.session;
    if (!session) {
      throw new Error("ctx with a session is required when once is true");
    }
    const keyboardData = session._data.latestKeyboard || null;
    if (!keyboardData || !Object.keys(keyboardData).length) {
      console.debug("No inline keyboard to remove");
      return;
    }

    if (
      keyboardData.message_id && keyboardData.chat_id &&
      keyboardData.inlineKeyboard
    ) {
      try {
        await ctx.api.editMessageReplyMarkup(
          keyboardData.chat_id,
          keyboardData.message_id,
          {
            reply_markup: new InlineKeyboard(),
          },
        );
      } catch (error) {
        console.error("Error removing last inline keyboard", error);
      }
    }

    session._data.latestKeyboard = null;
  }
}

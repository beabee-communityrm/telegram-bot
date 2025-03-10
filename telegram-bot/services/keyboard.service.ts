import { BaseService } from "../core/index.ts";
import {
  ForceReply,
  InlineKeyboard,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  Keyboard,
  Message,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  Singleton,
} from "../deps/index.ts";
import {
  FALSY_MESSAGE_KEY,
  INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE,
  INLINE_BUTTON_CALLBACK_SHOW_CALLOUT,
  TRUTHY_MESSAGE_KEY,
} from "../constants/index.ts";
import { I18nService } from "./i18n.service.ts";

import type { AppContext, GetCalloutDataExt } from "../types/index.ts";

/**
 * Service to create Telegram keyboard buttons
 */
@Singleton()
export class KeyboardService extends BaseService {
  constructor(
    protected readonly i18n: I18nService,
  ) {
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
    callouts: GetCalloutDataExt[],
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
      const id = callouts[i - 1].id;
      if (!id) {
        console.error(
          `Callout ${i} has no slug.\nSkipping...`,
        );
        continue;
      }
      const callbackData = `${INLINE_BUTTON_CALLBACK_SHOW_CALLOUT}:${id}`;

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
    prefix = INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE,
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
    prefix = INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE,
    keyboard = this.inlineEmpty(),
    doneLabel = this.i18n.t("bot.reactions.messages.done"),
  ) {
    const button = this.inlineDoneButton(prefix, doneLabel);
    return keyboard.text(button.text, button.callback_data).row();
  }

  /**
   * Creates or extends a inline keyboard with a done button.
   *
   * @param prefix A prefix to add to the button data, used to subscribe to the events
   * @param keyboard The keyboard to extend
   * @param doneLabel The label for the done button
   */
  public inlineDoneButton(
    prefix = `${INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE}:done`,
    doneLabel = this.i18n.t("bot.reactions.messages.done"),
  ): InlineKeyboardButton.CallbackButton {
    return {
      text: doneLabel,
      callback_data: `${prefix}:done`,
    };
  }

  /**
   * Create a keyboard for a callout response with a skip button.
   * @param keyboard The keyboard to extend
   * @param required
   * @param multiple
   */
  public skip(
    keyboard = this.empty(),
    required = false,
    skipLabel = this.i18n.t("bot.reactions.messages.skip"),
  ) {
    if (!required) {
      return keyboard.text(skipLabel).row();
    }

    return keyboard;
  }

  /**
   * Creates or extends a inline keyboard with a skip button.
   * @param prefix A prefix to add to the button data, used to subscribe to the events
   * @param keyboard The keyboard to extend
   * @param required
   * @param skipLabel The label for the skip button
   */
  public inlineSkip(
    prefix: string,
    keyboard = this.inlineEmpty(),
    required = false,
    skipLabel = this.i18n.t("bot.reactions.messages.skip"),
  ) {
    if (!required) {
      return keyboard.text(skipLabel, `${prefix}:skip`).row();
    }

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
        if (
          !ctx.update.callback_query?.message?.reply_markup?.inline_keyboard
            .flat().length
        ) {
          console.warn("No inline keyboard to remove");
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

  /** Remove a specific inline button from the keyboard */
  public removeInlineButton(
    keyboard: InlineKeyboard,
    buttonCallbackData: string,
  ) {
    const inlineKeyboard = new InlineKeyboard();

    for (const row of keyboard.inline_keyboard) {
      for (const button of row) {
        if (
          (button as InlineKeyboardButton.CallbackButton).callback_data !==
            buttonCallbackData
        ) {
          inlineKeyboard.text(
            button.text,
            (button as InlineKeyboardButton.CallbackButton).callback_data,
          );
        }
      }
      inlineKeyboard.row();
    }

    return inlineKeyboard;
  }

  /** Replace a specific inline button from the keyboard */
  public replaceInlineButton(
    keyboard: InlineKeyboard,
    buttonCallbackData: string,
    newButton: InlineKeyboardButton.CallbackButton,
  ) {
    const inlineKeyboard = new InlineKeyboard();

    for (const row of keyboard.inline_keyboard) {
      for (const button of row) {
        if (
          (button as InlineKeyboardButton.CallbackButton).callback_data ===
            buttonCallbackData
        ) {
          inlineKeyboard.text(
            newButton.text,
            newButton.callback_data,
          );
        } else {
          inlineKeyboard.text(
            button.text,
            (button as InlineKeyboardButton.CallbackButton).callback_data,
          );
        }
      }
      inlineKeyboard.row();
    }

    return inlineKeyboard;
  }

  /** Add a specific inline button to the keyboard */
  public addInlineButton(
    keyboard: InlineKeyboard,
    newButton: InlineKeyboardButton.CallbackButton,
  ) {
    keyboard.text(
      newButton.text,
      newButton.callback_data,
    );

    return keyboard;
  }

  /** Rename a specific inline button from the keyboard */
  public renameInlineButton(
    keyboard: InlineKeyboard,
    buttonCallbackData: string,
    newButtonText: string,
  ) {
    for (const row of keyboard.inline_keyboard) {
      for (const button of row) {
        if (
          (button as InlineKeyboardButton.CallbackButton).callback_data ===
            buttonCallbackData
        ) {
          button.text = newButtonText;
        }
      }
    }

    return keyboard;
  }

  public async removeLastInlineKeyboard(ctx: AppContext) {
    const session = await ctx.session;
    let removed = false;
    if (!session) {
      throw new Error("ctx with a session is required when once is true");
    }
    const keyboardData = session.latestKeyboard || null;
    if (!keyboardData || !Object.keys(keyboardData).length) {
      console.debug(
        "No last inline keyboard to remove, keyboardData: ",
        keyboardData,
      );
      return;
    }

    if (
      keyboardData.message_id && keyboardData.chat_id &&
      keyboardData.buttonCount
    ) {
      try {
        await ctx.api.editMessageReplyMarkup(
          keyboardData.chat_id,
          keyboardData.message_id,
          {
            reply_markup: new InlineKeyboard(),
          },
        );
        removed = true;
      } catch (error) {
        console.error("Error removing last inline keyboard", error);
        removed = false;
      }
    }

    await this.resetKeyboardInSession(ctx);
    return removed;
  }

  protected async resetKeyboardInSession(ctx: AppContext) {
    const session = await ctx.session;
    session.latestKeyboard = null;
    return session;
  }

  /**
   * Store the latest keyboard in the session to be able to remove it later
   * @param ctx
   * @param markup
   * @param message
   */
  public async storeLatestInSession(
    ctx: AppContext,
    markup:
      | InlineKeyboardMarkup
      | ReplyKeyboardMarkup
      | ReplyKeyboardRemove
      | ForceReply,
    message: Message | undefined = ctx.message,
  ) {
    if (!message) {
      throw new Error("Message is undefined");
    }
    const session = await ctx.session;
    if (
      markup instanceof InlineKeyboard &&
      markup.inline_keyboard.flat().length > 0
    ) {
      session.latestKeyboard = {
        message_id: message.message_id,
        chat_id: message.chat.id,
        type: "inline",
        buttonCount: markup.inline_keyboard.flat().length,
        // inlineKeyboard: markup,
      };
    } else if (
      markup instanceof Keyboard &&
      markup.keyboard.flat().length > 0
    ) {
      session.latestKeyboard = {
        message_id: message.message_id,
        chat_id: message.chat.id,
        type: "custom",
        buttonCount: markup.keyboard.flat().length,
        // customKeyboard: markup,
      };
    } else {
      console.warn("No keyboard to store");
    }
  }
}

import type { CallbackQuery, InlineKeyboardButton } from "../deps/index.ts";

export const getKeyboardButtonFromCallbackQuery = (
  callbackQuery: CallbackQuery,
  callbackQueryEventName = callbackQuery.data,
) => {
  return callbackQuery.message?.reply_markup?.inline_keyboard.flat().find((
    button,
  ) =>
    // TODO: fix type in Grammy?
    (button as InlineKeyboardButton.CallbackButton)
      .callback_data === callbackQueryEventName
  );
};

// Event related constants
export const INLINE_BUTTON_CALLBACK_PREFIX = "callback_query:data";

// Note: We choose short strings here because the length of these strings is limited in the Telegram bot API
// and the slug is appended here.The max allowed size of a callback string is 64 bytes.
export const INLINE_BUTTON_CALLBACK_SHOW_CALLOUT = "1";
export const INLINE_BUTTON_CALLBACK_CALLOUT_PARTICIPATE = "2";
export const INLINE_BUTTON_CALLBACK_CALLOUT_LIST = "3";

/**
 * Prefix for the callout response interaction events, used for skip and done inline buttons, perhaps useful for others.
 * @example
 * ```
 * ${INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE}:skip
 * ${INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE}:done
 * ```
 */
export const INLINE_BUTTON_CALLBACK_CALLOUT_RESPONSE = "ibccr";

export const TRUTHY_MESSAGE_KEY = "yes";
export const FALSY_MESSAGE_KEY = "no";

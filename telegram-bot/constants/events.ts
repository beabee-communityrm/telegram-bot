// Event related constants
export const BUTTON_CALLBACK_PREFIX = "callback_query:data"; // Do not change this prefix

// Note: We choose short strings here because the length of these strings is limited in the Telegram bot API
// and the slug is appended here.The max allowed size of a callback string is 64 bytes.
export const BUTTON_CALLBACK_SHOW_CALLOUT = "1";
export const BUTTON_CALLBACK_CALLOUT_INTRO = "2";
export const BUTTON_CALLBACK_CALLOUT_PARTICIPATE = "3";

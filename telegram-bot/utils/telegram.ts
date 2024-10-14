import type { Message } from "../deps/index.ts";
import type { AppContext } from "../types/index.ts";

/**
 * Extract the chat id from a context
 */
export const getChatId = (ctx: AppContext) => {
  const id = ctx.chat?.id || ctx.from?.id;
  if (!id) {
    throw new Error("No id found on context");
  }
  return id;
};

/**
 * Extract the session id from a context
 * * We use the chat id as the session id for now
 */
export const getSessionKey = (ctx: AppContext) => {
  return getChatId(ctx).toString();
};

/**
 * Extract the text from a message
 */
export const getTextFromMessage = (message?: Message) => {
  return message?.text?.trim() || "";
};

/**
 * Extract the file id from a message
 */
export const getFileIdFromMessage = (message?: Message) => {
  return message?.document?.file_id ||
    // TODO: You can download photos in different sizes
    message?.photo?.[message.photo.length - 1]?.file_id ||
    message?.audio?.file_id ||
    message?.voice?.file_id ||
    message?.video?.file_id ||
    message?.animation?.file_id;
};

/**
 * Extract the location from a message
 */
export const getLocationFromMessage = (message?: Message) => {
  return {
    location: message?.location || message?.venue?.location,
    address: message?.venue?.address,
    title: message?.venue?.title,
  };
};

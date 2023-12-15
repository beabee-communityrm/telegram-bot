import type { Context, Message } from "../types/index.ts";

export const getIdentifier = (ctx: Context) => {
  const id = ctx.chat?.id || ctx.from?.id;
  if (!id) {
    throw new Error("No id found on context");
  }
  return id;
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

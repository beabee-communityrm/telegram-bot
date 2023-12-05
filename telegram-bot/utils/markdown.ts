/**
 * Escape telegram markdown V2 characters
 * @param text
 * @returns
 */
export const escapeMd = (text: string) => {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
};

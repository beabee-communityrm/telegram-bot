/**
 * Truncates a string to a specified maximum length.
 *
 * @param input The string to be truncated.
 * @param maxLength The maximum allowed length of the string.
 * @returns The truncated string.
 */
export const truncateString = (input: string, maxLength: number): string => {
  return input.length > maxLength ? input.substring(0, maxLength) : input;
};

/**
 * Generates a URL-friendly slug from a given string.
 * It removes special characters, replaces spaces with hyphens, and converts to lowercase.
 *
 * @param input The string to be converted into a slug.
 * @returns The generated slug as a string.
 */
export const generateSlug = (input: string): string => {
  return input
    // Replace special characters with empty space
    .replace(/[^a-zA-Z0-9\s]/g, "")
    // Replace spaces with hyphens
    .replace(/\s+/g, "-")
    // Convert to lowercase
    .toLowerCase();
};

/**
 * Generates a URL-friendly slug from a given string and truncates it to a specified maximum length.
 * It removes special characters, replaces spaces with hyphens, and converts to lowercase.
 *
 * @param input The string to be converted into a slug.
 * @param maxLength The maximum allowed length of the slug.
 * @returns The generated slug as a string.
 */
export const truncateSlug = (input: string, maxLength = 32): string => {
  return truncateString(generateSlug(input), maxLength);
};

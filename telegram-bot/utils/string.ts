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

/**
 * Converts a string to camelCase format.
 * It removes special characters and spaces, then capitalizes the letter after each removed space while the first letter is in lowercase.
 * It splits the string by spaces, hyphens (-), and underscores (_).
 *
 * @param input The string to be converted to camelCase.
 * @returns The camelCase formatted string.
 */
export const toCamelCase = (input: string): string => {
  // Check if no need to convert
  if (!/[\s-_]/.test(input)) {
    return input;
  }

  return input
    // Remove special characters except spaces, hyphens, and underscores
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    // Split by spaces, hyphens, and underscores
    .split(/[\s-_]+/)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
};

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

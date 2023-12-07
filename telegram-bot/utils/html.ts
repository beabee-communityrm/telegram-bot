/**
 * Sanitizes HTML content by keeping only allowed tags and replacing or removing others.
 *
 * @param htmlContent The HTML content to be sanitized.
 * @returns The sanitized HTML content.
 */
export const sanitizeHtml = (htmlContent: string): string => {
  let sanitizedContent = htmlContent;

  // Replace specific tags with corresponding replacements
  const tagsToReplace: { [key: string]: string } = {
    "<p>": "\n",
    "<br>": "\n",
    "<br/>": "\n",
    // Additional specific replacements can be added here
  };

  for (const tag in tagsToReplace) {
    const replacement = tagsToReplace[tag];
    sanitizedContent = sanitizedContent.replace(
      new RegExp(tag, "gi"),
      replacement,
    );
  }

  // Remove all disallowed tags
  sanitizedContent = removeDisallowedTags(sanitizedContent);

  // Escape HTML entities
  sanitizedContent = escapeHtmlEntities(sanitizedContent);

  return sanitizedContent;
};

/**
 * Removes all HTML tags that are not allowed in Telegram.
 *
 * @param content The content from which to remove tags.
 * @returns The content with disallowed tags removed.
 */
export const removeDisallowedTags = (html: string): string => {
  const allowedTags = [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "ins",
    "s",
    "strike",
    "del",
    "span",
    "tg-spoiler",
    "a",
    "tg-emoji",
    "code",
    "pre",
  ];
  const regex = new RegExp(
    `<(?!\/?(?:${allowedTags.join("|")})\\b)[^>]*>`,
    "gi",
  );

  return html.replace(regex, "");
};

/**
 * Escapes HTML entities to prevent potential security risks.
 * Specifically replaces only those angle brackets which do not form part of a valid HTML tag.
 *
 * @param content The content in which to escape HTML entities.
 * @returns The content with HTML entities escaped.
 */
export const escapeHtmlEntities = (content: string): string => {
  // First replace & characters, except if they are part of an existing entity
  content = content.replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;");

  // Then replace < and > if they are not part of a tag
  content = content.replace(/<([^a-zA-Z\/!]|$)/g, "&lt;$1").replace(
    /([^a-zA-Z\/])>/g,
    "$1&gt;",
  );

  // Replace " and '
  content = content.replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  return content;
};

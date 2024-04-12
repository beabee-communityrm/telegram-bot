import {
  AmmoniaBuilder,
  ammoniaCleanText,
  ammoniaInit,
} from "../deps/index.ts";
import { ALLOWED_TAGS, DOT } from "../constants/index.ts";

const initAmmonia = async () => {
  await ammoniaInit();

  const ammoniaBuilder = new AmmoniaBuilder();
  ammoniaBuilder.tags.clear();
  for (const tag of ALLOWED_TAGS) {
    ammoniaBuilder.tags.add(tag);
  }
  return ammoniaBuilder.build();
};

const ammonia = await initAmmonia();

/**
 * Turn an arbitrary string into unformatted HTML.
 * @see https://deno.land/x/ammonia@0.3.1/mod.ts?s=cleanText
 * @param htmlContent The HTML content to be cleaned.
 * @returns The cleaned HTML content.
 */
export const escapeHtml = ammoniaCleanText;

/**
 * Sanitizes HTML content by keeping only Telegram allowed tags and replacing or removing others.
 *
 * @param htmlContent The HTML content to be sanitized.
 * @returns The sanitized HTML content.
 */
export const sanitizeHtml = (htmlContent: string): string => {
  let sanitizedContent = htmlContent;

  // Replace specific tags with corresponding replacements
  const tagsToReplace: { [key: string]: string } = {
    "<p\\s+.*?>": "\n", // Replace <p> tags with attributes, e.g. <p style="text-align: center;"> but not <pre>
    "<p>": "\n", // Replace <p> tags without attributes
    "</p>": "",
    "<br\/?>": "\n", // Replace <br> and <br/> tags
    "<h1>": "<strong>",
    "</h1>": "</strong>",
    "<h2>": "<strong>",
    "</h2>": "</strong>",
    "<h3>": "<strong>",
    "</h3>": "</strong>",
    "<h4>": "<strong>",
    "</h4>": "</strong>",
    "<h5>": "<strong>",
    "</h5>": "</strong>",
    "<h6>": "<strong>",
    "</h6>": "</strong>",
    "<li>": ` \n${DOT} `,
    "</li>": "",
    "&nbsp;": " ", // Replace &nbsp; with a space
    // Additional specific replacements can be added here
  };

  for (const tag in tagsToReplace) {
    const replacement = tagsToReplace[tag];
    sanitizedContent = sanitizedContent.replace(
      new RegExp(tag, "gm"),
      replacement,
    );
  }

  // Remove all disallowed tags but keep their content
  sanitizedContent = removeDisallowedTags(sanitizedContent, ["div"]);

  // Let Ammonia do the rest
  sanitizedContent = ammonia.clean(sanitizedContent);

  return sanitizedContent;
};

/**
 * Removes all HTML tags but keeps their content.
 *
 * @param content The content from which to remove tags.
 * @param disallowedTags The tags to remove.
 * @returns The content with disallowed tags removed.
 */
export const removeDisallowedTags = (
  html: string,
  disallowedTags: string[],
): string => {
  const regex = new RegExp(
    `<\/?(?:${disallowedTags.join("|")})\\b[^>]*>`,
    "gm",
  );

  return html.replace(regex, "");
};

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
        '<p>': '\n',
        // Additional specific replacements can be added here
    };

    for (const tag in tagsToReplace) {
        const replacement = tagsToReplace[tag];
        sanitizedContent = sanitizedContent.replace(new RegExp(tag, 'gi'), replacement);
    }

    // Remove all disallowed tags
    sanitizedContent = removeDisallowedTags(sanitizedContent);

    // Escape HTML entities
    sanitizedContent = escapeHtmlEntities(sanitizedContent);

    return sanitizedContent;
}

/**
 * Removes all HTML tags that are not allowed.
 * 
 * @param content The content from which to remove tags.
 * @returns The content with disallowed tags removed.
 */
export const removeDisallowedTags = (content: string): string => {
    const allowedTags = /<\/?(b|strong|i|em|u|ins|s|strike|del|span|tg-spoiler|a|tg-emoji|code|pre)[^>]*>/gi;
    return content.replace(/<\/?[^>]+(>|$)/gi, (tag) => allowedTags.test(tag) ? tag : '');
}

/**
 * Escapes HTML entities to prevent potential security risks.
 * 
 * @param content The content in which to escape HTML entities.
 * @returns The content with HTML entities escaped.
 */
export const escapeHtmlEntities = (content: string): string => {
    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

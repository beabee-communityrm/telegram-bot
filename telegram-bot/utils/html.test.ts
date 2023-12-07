import { removeDisallowedTags, sanitizeHtml } from "./html.ts";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("removeDisallowedTags removes disallowed tags", () => {
  const input =
    "<b>bold</b> <strong>strong</strong> <i>italic</i> <em>emphasized</em> <u>underlined</u> <ins>inserted</ins> <s>strikethrough</s> <strike>strike</strike> <del>deleted</del> <span>span</span> <tg-spoiler>spoiler</tg-spoiler> <a>anchor</a> <tg-emoji>emoji</tg-emoji> <code>code</code> <pre>preformatted</pre> <div>div</div> <p>paragraph</p>";
  const expected =
    "bold strong italic emphasized underlined inserted strikethrough strike <del>deleted</del> <span>span</span> <tg-spoiler>spoiler</tg-spoiler> <a>anchor</a> <tg-emoji>emoji</tg-emoji> <code>code</code> <pre>preformatted</pre> <div>div</div> <p>paragraph</p>";

  const result = removeDisallowedTags(input, [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "ins",
    "s",
    "strike",
  ]);

  assertEquals(result, expected);
});

Deno.test("sanitizeHtml removes disallowed tags", () => {
  const input =
    "<b>bold</b> <strong>strong</strong> <i>italic</i> <em>emphasized</em> <u>underlined</u> <ins>inserted</ins> <s>strikethrough</s> <strike>strike</strike> <del>deleted</del> <span>span</span> <tg-spoiler>spoiler</tg-spoiler> <a>anchor</a> <tg-emoji>emoji</tg-emoji> <code>code</code> <pre>preformatted</pre> <div>div</div>";
  const expected =
    '<b>bold</b> <strong>strong</strong> <i>italic</i> <em>emphasized</em> <u>underlined</u> <ins>inserted</ins> <s>strikethrough</s> <strike>strike</strike> <del>deleted</del> <span>span</span> <tg-spoiler>spoiler</tg-spoiler> <a rel="noopener noreferrer">anchor</a> <tg-emoji>emoji</tg-emoji> <code>code</code> <pre>preformatted</pre> div';

  const result = sanitizeHtml(input);

  assertEquals(result, expected);
});

Deno.test("sanitizeHtml removes disallowed tags and attributes", () => {
  const input = '<div><p class="foo" style="color: red;">Hello world</p></div>';
  const expected = "\nHello world";

  const result = sanitizeHtml(input);

  assertEquals(result, expected);
});

Deno.test("sanitizeHtml should escape HTML entities", () => {
  const input = `This is a test &, > and < should be escaped.`;
  const expected = `This is a test &amp;, &gt; and &lt; should be escaped.`;

  const result = sanitizeHtml(input);

  assertEquals(result, expected);
});

Deno.test("sanitizeHtml should escape HTML entities", () => {
  const input = `<p>paragraph</p> and <br/> should be replaced with new lines.`;
  const expected = `\nparagraph and \n should be replaced with new lines.`;

  const result = sanitizeHtml(input);

  assertEquals(result, expected);
});

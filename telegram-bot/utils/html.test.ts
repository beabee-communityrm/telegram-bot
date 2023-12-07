import { escapeHtmlEntities, removeDisallowedTags } from "./html.ts";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("removeDisallowedTags removes disallowed tags", () => {
  const input =
    "<b>bold</b> <strong>strong</strong> <i>italic</i> <em>emphasized</em> <u>underlined</u> <ins>inserted</ins> <s>strikethrough</s> <strike>strike</strike> <del>deleted</del> <span>span</span> <tg-spoiler>spoiler</tg-spoiler> <a>anchor</a> <tg-emoji>emoji</tg-emoji> <code>code</code> <pre>preformatted</pre> <div>div</div> <p>paragraph</p>";
  const expected =
    "<b>bold</b> <strong>strong</strong> <i>italic</i> <em>emphasized</em> <u>underlined</u> <ins>inserted</ins> <s>strikethrough</s> <strike>strike</strike> <del>deleted</del> <span>span</span> <tg-spoiler>spoiler</tg-spoiler> <a>anchor</a> <tg-emoji>emoji</tg-emoji> <code>code</code> <pre>preformatted</pre> div paragraph";

  const result = removeDisallowedTags(input);

  assertEquals(result, expected);
});

Deno.test("escapeHtmlEntities should escape HTML entities and not valid HTML tags", () => {
  const testString =
    `This is a test &, < and > should be escaped, but <b>bold</b>, <p>paragraph</p> and <br/> should not.`;
  const expectedResult =
    `This is a test &amp;, &lt; and &gt; should be escaped, but <b>bold</b>, <p>paragraph</p> and <br/> should not.`;

  const result = escapeHtmlEntities(testString);

  assertEquals(result, expectedResult);
});

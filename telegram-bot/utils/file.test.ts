import { filterMimeTypesByPatterns, mimeTypeNames } from "./file.ts";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("filterMimeTypesByPatterns converts file patterns to mime types", () => {
  const input = "image/jpeg,image/png";
  const expected = ["image/jpeg", "image/png"];

  const result = filterMimeTypesByPatterns(input);

  assertEquals(result, expected);
});

Deno.test("filterMimeTypesByPatterns trims whitespace from file patterns", () => {
  const input = " image/jpeg , image/png ";
  const expected = ["image/jpeg", "image/png"];

  const result = filterMimeTypesByPatterns(input);

  assertEquals(result, expected);
});

Deno.test("filterMimeTypesByPatterns returns an empty array for an empty string", () => {
  const input = "";
  const expected: string[] = [];

  const result = filterMimeTypesByPatterns(input);

  assertEquals(result, expected);
});

Deno.test("filterMimeTypesByPatterns returns an empty array for an empty string", () => {
  const input = "image/*";
  const expected = mimeTypeNames.filter((mimeType) =>
    mimeType.startsWith("image/")
  );

  const result = filterMimeTypesByPatterns(input);

  assertEquals(result, expected);
});

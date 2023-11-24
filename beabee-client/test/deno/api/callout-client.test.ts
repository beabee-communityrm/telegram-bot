import { CalloutClient } from '../../../src/api/callout-client.ts';
import { assertEquals, assert } from "std/assert/mod.ts";

Deno.test("CalloutClient is a class and has a get method", () => {
  const calloutClient = new CalloutClient("");

  // Check if CalloutClient is a class
  assertEquals(typeof CalloutClient, 'function');

  // Check if get method exists
  assert('get' in calloutClient);
});
import { CalloutClient } from "../../../out/mod.js";
import { describe, expect, test } from "@jest/globals";

describe("CalloutClient", () => {
  const calloutClient = new CalloutClient("");

  test("is a class", () => {
    expect(typeof CalloutClient).toBe("function");
  });

  test("has a get method", () => {
    expect("get" in calloutClient).toBeTruthy();
  });
});

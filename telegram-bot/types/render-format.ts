import type { RenderBase } from "./index.ts";
import { RenderType } from "../enums/index.ts";
import { Stringable } from "../deps/index.ts";

/** Used for Grammy [parse mode plugin](https://grammy.dev/plugins/parse-mode) */
export interface RenderFormat extends RenderBase {
  type: RenderType.FORMAT;
  format: TemplateStringsArray | Stringable[];
}

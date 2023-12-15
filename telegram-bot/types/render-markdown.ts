import type { RenderBase } from "./index.ts";
import { RenderType } from "../enums/index.ts";

export interface RenderMarkdown extends RenderBase {
  type: RenderType.MARKDOWN;
  markdown: string;
}

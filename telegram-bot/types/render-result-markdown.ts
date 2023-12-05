import type { RenderResultBase } from "./index.ts";
import { RenderResultType } from "../enums/index.ts";

export interface RenderResultMarkdown extends RenderResultBase {
  type: RenderResultType.MARKDOWN;
  markdown: string;
}

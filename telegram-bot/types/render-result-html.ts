import type { RenderResultBase } from "./index.ts";
import { RenderResultType } from "../enums/index.ts";

export interface RenderResultHtml extends RenderResultBase {
  type: RenderResultType.HTML;
  html: string;
}

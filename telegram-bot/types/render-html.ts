import type { RenderBase } from "./index.ts";
import { RenderType } from "../enums/index.ts";

export interface RenderHtml extends RenderBase {
  type: RenderType.HTML;
  html: string;
}

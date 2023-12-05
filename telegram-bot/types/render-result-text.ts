import type { RenderResultBase } from "./index.ts";
import { RenderResultType } from "../enums/index.ts";

export interface RenderResultText extends RenderResultBase {
  type: RenderResultType.TEXT;
  text: string;
}

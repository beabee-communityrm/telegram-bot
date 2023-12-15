import type { RenderBase } from "./index.ts";
import { RenderType } from "../enums/index.ts";

export interface RenderText extends RenderBase {
  type: RenderType.TEXT;
  text: string;
}

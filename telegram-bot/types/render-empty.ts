import type { RenderBase } from "./index.ts";
import { RenderType } from "../enums/index.ts";

export interface RenderEmpty extends RenderBase {
  type: RenderType.EMPTY;
  keyboard: undefined;
}

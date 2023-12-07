import type { RenderResultBase } from "./index.ts";
import { RenderResultType } from "../enums/index.ts";

export interface RenderResultEmpty extends RenderResultBase {
  type: RenderResultType.EMPTY;
  keyboard: undefined;
}

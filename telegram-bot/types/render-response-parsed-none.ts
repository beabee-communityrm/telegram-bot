import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedNone
  extends RenderResponseParsedBase<null, false> {
  /** The type of the parsed data */
  type: ParsedResponseType.NONE;
}

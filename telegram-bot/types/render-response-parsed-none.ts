import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedNone<MULTI extends boolean>
  extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.NONE;
  /** TODO: Only null for `RenderResponseParsedNone` */
  replay: null;
  /** The parsed data */
  data: null;
}

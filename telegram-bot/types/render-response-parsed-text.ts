import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedText<MULTI extends boolean = boolean>
  extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.TEXT;
  /** The parsed data */
  data: MULTI extends true ? string[] : string;
}

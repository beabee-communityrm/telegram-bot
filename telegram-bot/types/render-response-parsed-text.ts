import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedText<MULTI extends boolean>
  extends RenderResponseParsedBase<string, MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.TEXT;
}

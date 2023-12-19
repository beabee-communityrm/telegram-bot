import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedNumber<MULTI extends boolean>
  extends RenderResponseParsedBase<number, MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.NUMBER;
}

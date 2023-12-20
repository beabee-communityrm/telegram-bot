import type { Context } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedBase<MULTI extends boolean = boolean> {
  /** The type of the parsed data */
  type: ParsedResponseType;
  multiple: MULTI;
  /** The original unparsed context */
  context: MULTI extends true ? Context[] : Context;
}

import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedAny<MULTI extends boolean> extends
  // deno-lint-ignore no-explicit-any
  RenderResponseParsedBase<any, MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.ANY;
}

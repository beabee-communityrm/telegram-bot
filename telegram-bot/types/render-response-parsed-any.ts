import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedAny<MULTI extends boolean = boolean>
  extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.ANY;
  /** The parsed data */
  // deno-lint-ignore no-explicit-any
  data: MULTI extends true ? any[] : any;
}

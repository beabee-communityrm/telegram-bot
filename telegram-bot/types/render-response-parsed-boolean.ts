import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

/** E.g. Checkbox */
export interface RenderResponseParsedBoolean<MULTI extends boolean = boolean>
  extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.BOOLEAN;
  /** The parsed data */
  data: MULTI extends true ? boolean[] : boolean;
}

import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

/** E.g. Checkbox */
export interface RenderResponseParsedBoolean<MULTI extends boolean>
  extends RenderResponseParsedBase<boolean, MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.BOOLEAN;
}

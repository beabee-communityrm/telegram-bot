import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedMultiSelect
  extends RenderResponseParsedBase<Record<string, boolean>, false> {
  /** The type of the parsed data */
  type: ParsedResponseType.MULTI_SELECT;
}

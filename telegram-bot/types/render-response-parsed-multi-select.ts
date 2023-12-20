import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedMultiSelect<
  MULTI extends boolean = boolean,
> extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.MULTI_SELECT;
  /** The parsed data */
  data: Record<string, boolean>;
}

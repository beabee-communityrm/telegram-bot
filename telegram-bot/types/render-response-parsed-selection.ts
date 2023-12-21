import type { RenderResponseParsedBase } from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedSelection<
  MULTI extends boolean = boolean,
> extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.SELECTION;
  /** The parsed data */
  data: Record<string, boolean>;
}

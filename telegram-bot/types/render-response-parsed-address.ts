import type { RenderResponseParsedBase } from "./index.ts";
import { CalloutResponseAnswerAddress } from "../deps.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedAddress<MULTI extends boolean = boolean>
  extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.ADDRESS;
  /** The parsed data */
  data: MULTI extends true ? CalloutResponseAnswerAddress[]
    : CalloutResponseAnswerAddress;
}

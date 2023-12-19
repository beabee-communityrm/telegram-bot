import type {
  CalloutResponseAnswerAddress,
  RenderResponseParsedBase,
} from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedAddress<MULTI extends boolean>
  extends RenderResponseParsedBase<CalloutResponseAnswerAddress, MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.ADDRESS;
}

import type { RenderResponseParsedBase } from "./index.ts";
import { CalloutResponseAnswer } from "../deps/index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedCalloutComponent<
  MULTI extends boolean = boolean,
> extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.CALLOUT_COMPONENT;
  // componentType: CalloutComponentType;
  /** The parsed data */
  data: MULTI extends true ? CalloutResponseAnswer[] : CalloutResponseAnswer;
}

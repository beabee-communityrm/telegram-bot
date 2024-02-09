import type { RenderResponseParsedBase } from "./index.ts";
import { CalloutResponseAnswerFileUpload } from "../deps.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedFile<MULTI extends boolean = boolean>
  extends RenderResponseParsedBase<MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.FILE;
  /** The parsed data */
  data: MULTI extends true ? CalloutResponseAnswerFileUpload[]
    : CalloutResponseAnswerFileUpload;
}

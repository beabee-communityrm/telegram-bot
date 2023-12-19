import type {
  CalloutResponseAnswerFileUpload,
  RenderResponseParsedBase,
} from "./index.ts";
import type { ParsedResponseType } from "../enums/index.ts";

export interface RenderResponseParsedFile<MULTI extends boolean>
  extends RenderResponseParsedBase<CalloutResponseAnswerFileUpload, MULTI> {
  /** The type of the parsed data */
  type: ParsedResponseType.FILE;
}

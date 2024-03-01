import type {
  RenderResponseParsedAny,
  RenderResponseParsedBoolean,
  RenderResponseParsedCalloutComponent,
  RenderResponseParsedFile,
  RenderResponseParsedNone,
  RenderResponseParsedNumber,
  RenderResponseParsedSelection,
  RenderResponseParsedText,
} from "./index.ts";

export type RenderResponseParsed<MULTI extends boolean = boolean> =
  | RenderResponseParsedText<MULTI>
  | RenderResponseParsedNumber<MULTI>
  | RenderResponseParsedBoolean<MULTI>
  | RenderResponseParsedSelection<MULTI>
  | RenderResponseParsedFile<MULTI>
  | RenderResponseParsedAny<MULTI>
  | RenderResponseParsedNone<MULTI>
  | RenderResponseParsedCalloutComponent<MULTI>;

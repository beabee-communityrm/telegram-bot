import type {
  RenderResponseParsedAddress,
  RenderResponseParsedAny,
  RenderResponseParsedBoolean,
  RenderResponseParsedFile,
  RenderResponseParsedMultiSelect,
  RenderResponseParsedNone,
  RenderResponseParsedNumber,
  RenderResponseParsedText,
} from "./index.ts";

export type RenderResponseParsed<MULTI extends boolean = boolean> =
  | RenderResponseParsedText<MULTI>
  | RenderResponseParsedNumber<MULTI>
  | RenderResponseParsedAddress<MULTI>
  | RenderResponseParsedBoolean<MULTI>
  | RenderResponseParsedMultiSelect<MULTI>
  | RenderResponseParsedFile<MULTI>
  | RenderResponseParsedAny<MULTI>
  | RenderResponseParsedNone<MULTI>;

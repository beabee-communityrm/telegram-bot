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

export type RenderResponseParsed<MULTI extends boolean> =
  | RenderResponseParsedText<MULTI>
  | RenderResponseParsedNumber<MULTI>
  | RenderResponseParsedAddress<MULTI>
  | RenderResponseParsedBoolean<MULTI>
  | RenderResponseParsedMultiSelect
  | RenderResponseParsedFile<MULTI>
  | RenderResponseParsedAny<MULTI>
  | RenderResponseParsedNone;

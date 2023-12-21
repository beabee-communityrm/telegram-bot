import type {
  RenderResponseParsedAddress,
  RenderResponseParsedAny,
  RenderResponseParsedBoolean,
  RenderResponseParsedFile,
  RenderResponseParsedNone,
  RenderResponseParsedNumber,
  RenderResponseParsedSelection,
  RenderResponseParsedText,
} from "./index.ts";

export type RenderResponseParsed<MULTI extends boolean = boolean> =
  | RenderResponseParsedText<MULTI>
  | RenderResponseParsedNumber<MULTI>
  | RenderResponseParsedAddress<MULTI>
  | RenderResponseParsedBoolean<MULTI>
  | RenderResponseParsedSelection<MULTI>
  | RenderResponseParsedFile<MULTI>
  | RenderResponseParsedAny<MULTI>
  | RenderResponseParsedNone<MULTI>;

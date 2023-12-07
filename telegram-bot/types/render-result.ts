import type {
  RenderResultEmpty,
  RenderResultHtml,
  RenderResultMarkdown,
  RenderResultPhoto,
  RenderResultText,
} from "./index.ts";

export type RenderResult =
  | RenderResultEmpty
  | RenderResultMarkdown
  | RenderResultPhoto
  | RenderResultHtml
  | RenderResultText;

import type {
  RenderResultHtml,
  RenderResultMarkdown,
  RenderResultPhoto,
  RenderResultText,
} from "./index.ts";

export type RenderResult =
  | RenderResultMarkdown
  | RenderResultPhoto
  | RenderResultHtml
  | RenderResultText;

import type {
  RenderResultHtml,
  RenderResultMarkdown,
  RenderResultPhoto,
} from "./index.ts";

export type RenderResult =
  | RenderResultMarkdown
  | RenderResultPhoto
  | RenderResultHtml;

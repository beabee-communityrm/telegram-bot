import type {
  RenderEmpty,
  RenderHtml,
  RenderMarkdown,
  RenderPhoto,
  RenderText,
} from "./index.ts";

export type Render =
  | RenderEmpty
  | RenderMarkdown
  | RenderPhoto
  | RenderHtml
  | RenderText;

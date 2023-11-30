import { RenderResultType } from "../enums/index.ts";

export interface RenderResultMarkdown {
    type: RenderResultType.MARKDOWN;
    markdown: string;
}
import { RenderResultType } from "../enums/index.ts";

export interface RenderResultHtml {
    type: RenderResultType.HTML;
    html: string;
}
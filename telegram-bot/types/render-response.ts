import type { Render, RenderResponseParsed } from "./index.ts";

/**
 * Type to collect responses. A response can be a text or file message.
 */
export interface RenderResponse<MULTI extends boolean = boolean> {
  render: Render;
  responses: RenderResponseParsed<MULTI>;
}

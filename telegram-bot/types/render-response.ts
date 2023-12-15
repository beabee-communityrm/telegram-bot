import type { Context, Render } from "./index.ts";

/**
 * Type to collect responses. A response can be a text or file message.
 */
export interface RenderResponse {
  render: Render;
  responses: Array<Context | Array<Context>>;
}

import { RenderResultType } from "../enums/index.ts";

import type { RenderResultEmpty } from "../types/index.ts";

export const EMPTY_RENDER_RESULT: RenderResultEmpty = {
  type: RenderResultType.EMPTY,
  keyboard: undefined,
};

import { RenderType } from "../enums/index.ts";

import type { RenderEmpty } from "../types/index.ts";

export const EMPTY_RENDER: RenderEmpty = {
  key: "",
  type: RenderType.EMPTY,
  keyboard: undefined,
};

export const CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR = "-slide:";

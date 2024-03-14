import { ParsedResponseType, RenderType, ReplayType } from "../enums/index.ts";

import type { RenderEmpty } from "../types/index.ts";

export const EMPTY_RENDER: RenderEmpty = {
  key: "",
  type: RenderType.EMPTY,
  keyboard: undefined,
  accepted: {
    multiple: false,
    required: false,
    type: ReplayType.NONE,
    doneTexts: [],
    skipTexts: [],
  },
  parseType: ParsedResponseType.NONE,
};

export const CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR = "-slide:";

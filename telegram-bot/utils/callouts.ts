// TODO: Move to common or use common utils

import { CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR } from "../constants/index.ts";
import { ParsedResponseType } from "../enums/index.ts";

import { CalloutComponentType } from "../deps.ts";

import type { CalloutComponentSchema } from "../deps.ts";

export const createCalloutGroupKey = (key: string, prefix: string) => {
  return prefix + CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR + key;
};

export const splitCalloutGroupKey = (key: string) => {
  if (!key || !key.includes(CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR)) {
    throw new Error(`Invalid key: ${key}`);
  }
  const [prefix, ...rest] = key.split(CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR);
  return [prefix, rest.join(CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR)];
};

export const isCalloutGroupKey = (key: string) => {
  return key.includes(CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR);
};

export const calloutComponentTypeToParsedResponseType = (
  component: CalloutComponentSchema,
): ParsedResponseType => {
  switch (component.type) {
    case CalloutComponentType.INPUT_EMAIL:
    case CalloutComponentType.INPUT_TEXT_FIELD:
    case CalloutComponentType.INPUT_TEXT_AREA:
    case CalloutComponentType.INPUT_PHONE_NUMBER:
    case CalloutComponentType.INPUT_CURRENCY:
    case CalloutComponentType.INPUT_DATE_TIME: // TODO: parse date
    case CalloutComponentType.INPUT_TIME: // TODO: parse time
    case CalloutComponentType.INPUT_URL: {
      return ParsedResponseType.TEXT;
    }

    case CalloutComponentType.CONTENT: {
      return ParsedResponseType.NONE;
    }

    case CalloutComponentType.INPUT_CHECKBOX: {
      return ParsedResponseType.BOOLEAN;
    }

    case CalloutComponentType.INPUT_NUMBER: {
      return ParsedResponseType.NUMBER;
    }

    case CalloutComponentType.INPUT_ADDRESS: {
      return ParsedResponseType.ADDRESS;
    }

    case CalloutComponentType.INPUT_FILE:
    case CalloutComponentType.INPUT_SIGNATURE: {
      return ParsedResponseType.FILE;
    }

    case CalloutComponentType.INPUT_SELECTABLE_RADIO:
    case CalloutComponentType.INPUT_SELECTABLE_SELECTBOXES:
    case CalloutComponentType.INPUT_SELECT: {
      return ParsedResponseType.SELECTION;
    }

    case CalloutComponentType.NESTABLE_PANEL:
    case CalloutComponentType.NESTABLE_TABS:
    case CalloutComponentType.NESTABLE_WELL: {
      return ParsedResponseType.NONE;
    }

    default: {
      console.warn(
        `Unknown component type ${(component as CalloutComponentSchema).type}`,
      );
      return ParsedResponseType.NONE;
    }
  }
};

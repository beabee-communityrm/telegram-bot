// deno-lint-ignore-file no-fallthrough
import { CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR } from "../constants/index.ts";
import {
  CalloutComponentMainType,
  ParsedResponseType,
} from "../enums/index.ts";

import type {
  BaseCalloutComponentSchema,
  CalloutComponentSchema,
  InputCalloutComponentSchema,
  RadioCalloutComponentSchema,
  SelectCalloutComponentSchema,
} from "../types/index.ts";

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

export const calloutComponentTypeToMainType = (
  component: CalloutComponentSchema,
) => {
  switch (component.type) {
    // Input components
    case "address":
    case "button":
    case "checkbox":
    case "email":
    case "number":
    case "password":
    case "textfield":
    case "textarea":
    case "content":
    case "phoneNumber":
    case "currency":
    case "datetime":
    case "time":
    case "url": {
      return CalloutComponentMainType.INPUT;
    }
    // File components
    case "file":
    case "signature": {
      return CalloutComponentMainType.FILE;
    }
    // Radio components
    case "radio":
    case "selectboxes": {
      return CalloutComponentMainType.RADIO;
    }

    // Select components
    case "select": {
      return CalloutComponentMainType.SELECT;
    }
    // Nested components
    case "panel":
    case "tabs":
    case "well": {
      return CalloutComponentMainType.NESTED;
    }
    default: {
      return CalloutComponentMainType.UNKNOWN;
    }
  }
};

export const calloutComponentTypeToParsedResponseType = (
  component:
    | CalloutComponentSchema
    | BaseCalloutComponentSchema
    | InputCalloutComponentSchema
    | RadioCalloutComponentSchema
    | SelectCalloutComponentSchema
    | InputCalloutComponentSchema,
): ParsedResponseType => {
  switch (component.type) {
    case "button":
    case "email":
    case "password":
    case "textfield":
    case "textarea":
    case "content":
    case "phoneNumber":
    case "currency":
    case "datetime": // TODO: parse date
    case "time": // TODO: parse time
    case "url": {
      return ParsedResponseType.TEXT;
    }

    case "checkbox": {
      return ParsedResponseType.BOOLEAN;
    }

    case "number": {
      return ParsedResponseType.NUMBER;
    }

    case "address": {
      return ParsedResponseType.ADDRESS;
    }

    case "file":
    case "signature": {
      return ParsedResponseType.FILE;
    }

    case "radio":
    case "selectboxes":
    case "select": {
      return ParsedResponseType.SELECTION;
    }

    case "panel":
    case "tabs":
    case "well": {
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

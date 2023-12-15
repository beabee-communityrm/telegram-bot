// deno-lint-ignore-file no-fallthrough
import { CALLOUT_RESPONSE_GROUP_KEY_SEPARATOR } from "../constants/index.ts";
import { CalloutComponentMainType } from "../enums/index.ts";

import type { CalloutComponentSchema } from "../types/index.ts";

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

export const getComponentMainType = (component: CalloutComponentSchema) => {
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
    // TODO: missing in common types
    case "content" as unknown:
    case "phoneNumber" as unknown:
    case "currency" as unknown:
    case "datetime" as unknown:
    case "time" as unknown:
    case "url" as unknown: {
      return CalloutComponentMainType.INPUT;
    }
    // File components
    case "file":
    case "signature" as unknown: {
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

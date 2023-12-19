import { Singleton } from "alosaur/mod.ts";

import {
  CalloutComponentMainType,
  ParsedResponseType,
} from "../enums/index.ts";
import {
  calloutComponentTypeToMainType,
  extractNumbers,
  getFileIdFromMessage,
  getLocationFromMessage,
  getTextFromMessage,
  isCalloutGroupKey,
  splitCalloutGroupKey,
} from "../utils/index.ts";

import type {
  CalloutResponseAnswer,
  CalloutResponseAnswers,
  Context,
  RenderResponse,
  RenderResponseParsedAddress,
  RenderResponseParsedBoolean,
  RenderResponseParsedFile,
  RenderResponseParsedMultiSelect,
  RenderResponseParsedNumber,
  RenderResponseParsedText,
} from "../types/index.ts";

/**
 * Service to transform message responses
 */
@Singleton()
export class TransformService {
  constructor() {
    console.debug(`${TransformService.name} created`);
  }

  public parseResponseFile(
    contexts: Context | Context[],
  ): RenderResponseParsedFile<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const res = contexts.map((ctx) => {
      const fileId = getFileIdFromMessage(ctx.message);
      if (!fileId) {
        throw new Error("No file id found in message");
      }
      return {
        // TODO: Get the file from the telegram api and upload it to beabee api and use the new url here
        url: fileId,
      };
    });
    return res;
  }

  public parseResponseText(
    contexts: Context | Context[],
  ): RenderResponseParsedText<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const texts = contexts.filter((ctx) => ctx.message?.text)
      .map((
        ctx,
      ) => getTextFromMessage(ctx.message));

    return texts;
  }

  public parseResponseMultiSelect(
    contexts: Context | Context[],
  ): RenderResponseParsedMultiSelect["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const res: RenderResponseParsedMultiSelect["data"] = {};

    for (const ctx of contexts.filter((ctx) => ctx.message?.text)) {
      const value = getTextFromMessage(ctx.message);
      res[value] = true;
      // TODO: Add false values
    }

    return res;
  }

  public parseResponseBoolean(
    contexts: Context | Context[],
  ): RenderResponseParsedBoolean<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const booleans = contexts.filter((ctx) => ctx.message?.text).map((
      ctx,
    ) => {
      const boolStr = getTextFromMessage(ctx.message);
      if (boolStr === "true") {
        return true;
      }
      if (boolStr === "false") {
        return false;
      }
      console.warn(`Unknown boolean value: "${boolStr}"`);
      return false;
    });

    return booleans;
  }

  public parseResponseNumber(
    contexts: Context | Context[],
  ): RenderResponseParsedNumber<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const texts = contexts.filter((ctx) => ctx.message?.text).map((
      ctx,
    ) => {
      const text = getTextFromMessage(ctx.message);
      return extractNumbers(text);
    });

    return texts;
  }

  public parseResponseAddress(
    contexts: Context | Context[],
  ): RenderResponseParsedAddress<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const addresses: RenderResponseParsedAddress<true>["data"] = contexts
      .filter((ctx) => ctx.message?.text).map((
        ctx,
      ) => {
        const location = getLocationFromMessage(ctx.message);
        const address: RenderResponseParsedAddress<false>["data"] = {
          formatted_address: getTextFromMessage(ctx.message) ||
            location.address || location.title || "",
          geometry: {
            location: {
              lat: location.location?.latitude || 0,
              lng: location.location?.longitude || 0,
            },
          },
        };
        return address;
      });

    return addresses;
  }

  /**
   * Convert a render response to a callout answer
   * @returns
   */
  public parseResponse(
    context: Context | Context[],
    type: ParsedResponseType,
  ) {
    switch (type) {
      case ParsedResponseType.FILE:
        return this.parseResponseFile(context);
      case ParsedResponseType.TEXT:
        return this.parseResponseText(context);
      case ParsedResponseType.MULTI_SELECT:
        return this.parseResponseMultiSelect(context);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponseBoolean(context);
      case ParsedResponseType.NUMBER:
        return this.parseResponseNumber(context);
      case ParsedResponseType.ADDRESS:
        return this.parseResponseAddress(context);
      case ParsedResponseType.ANY:
        return [
          ...this.parseResponseText(context),
          this.parseResponseFile(context),
        ];
      case ParsedResponseType.NONE:
        return [];
      default:
        throw new Error(`Unknown parse response type: "${type}"`);
    }
  }

  /**
   * Group responses by slide
   * - The key of the response is expected to be a group key
   * - The first part of the group key is the slide id
   * - The second part of the group key is the component key
   * @param responses The responses to group
   * @returns
   */
  protected groupResponsesByGroupKey(responses: RenderResponse[]) {
    const slides: Record<string, RenderResponse[]> = {};

    for (const response of responses) {
      if (!isCalloutGroupKey(response.render.key)) {
        console.warn("Response key is not a group key:", response.render.key);
        continue;
      }
      const [slideId] = splitCalloutGroupKey(response.render.key);
      if (!slides[slideId]) {
        slides[slideId] = [];
      }
      slides[slideId].push(response);
    }

    return slides;
  }

  /**
   * Convert render responses to callout answers
   * @param responses The responses to convert
   * @returns
   */
  public parseResponses(
    responses: RenderResponse[],
  ) {
    const slideResponses = this.groupResponsesByGroupKey(responses);
    const answers: CalloutResponseAnswers = {};
    for (const [slideId, responses] of Object.entries(slideResponses)) {
      const slideAnswers: Record<
        string,
        CalloutResponseAnswer | CalloutResponseAnswer[]
      > = {};
      for (const response of responses) {
        const [_, key] = splitCalloutGroupKey(response.render.key);
        slideAnswers[key] = response.responses.data;
      }
      answers[slideId] = slideAnswers;
    }

    return answers;
  }
}

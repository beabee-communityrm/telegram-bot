import { Singleton } from "alosaur/mod.ts";

import { ParsedResponseType } from "../enums/index.ts";
import {
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
  RenderResponseParsed,
  RenderResponseParsedAddress,
  RenderResponseParsedAny,
  RenderResponseParsedBoolean,
  RenderResponseParsedFile,
  RenderResponseParsedMultiSelect,
  RenderResponseParsedNone,
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
    context: Context,
  ): RenderResponseParsedFile<false>["data"] {
    const fileId = getFileIdFromMessage(context.message);
    if (!fileId) {
      throw new Error("No file id found in message");
    }
    return {
      // TODO: Get the file from the telegram api and upload it to beabee api and use the new url here
      url: fileId,
    };
  }

  public parseResponsesFile(
    contexts: Context[],
  ): RenderResponseParsedFile<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const res = contexts.map(this.parseResponseFile);
    return res;
  }

  public parseResponseText(
    context: Context,
  ): RenderResponseParsedText<false>["data"] {
    return getTextFromMessage(context.message);
  }

  public parseResponsesText(
    contexts: Context[],
  ): RenderResponseParsedText<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const texts = contexts.filter((ctx) => ctx.message?.text)
      .map((
        ctx,
      ) => getTextFromMessage(ctx.message));

    return texts;
  }

  public parseResponseMultiSelect(
    context: Context,
  ): RenderResponseParsedMultiSelect<false>["data"] {
    const res: RenderResponseParsedMultiSelect<false>["data"] = {};

    const value = getTextFromMessage(context.message);
    res[value] = true;

    return res;
  }

  public parseResponsesMultiSelect(
    contexts: Context[],
  ): RenderResponseParsedMultiSelect<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    let res: RenderResponseParsedMultiSelect<true>["data"] = {};

    for (const ctx of contexts.filter((ctx) => ctx.message?.text)) {
      res = { ...res, ...this.parseResponseMultiSelect(ctx) };
    }

    return res;
  }

  public parseResponseBoolean(
    context: Context,
  ): RenderResponseParsedBoolean<false>["data"] {
    const boolStr = getTextFromMessage(context.message);
    let bool = false;
    if (boolStr === "true") {
      bool = true;
    } else if (boolStr === "false") {
      bool = false;
    } else {
      console.warn(`Unknown boolean value: "${boolStr}"`);
    }
    return bool;
  }

  public parseResponsesBoolean(
    contexts: Context[],
  ): RenderResponseParsedBoolean<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const booleans = contexts.filter((ctx) => ctx.message?.text).map(
      this.parseResponseBoolean,
    );

    return booleans;
  }

  public parseResponseNumber(
    context: Context,
  ): RenderResponseParsedNumber<false>["data"] {
    const text = getTextFromMessage(context.message);
    return extractNumbers(text);
  }

  public parseResponsesNumber(
    contexts: Context[],
  ): RenderResponseParsedNumber<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const texts = contexts.filter((ctx) => ctx.message?.text).map(
      this.parseResponseNumber,
    );

    return texts;
  }

  public parseResponseAddress(
    context: Context,
  ): RenderResponseParsedAddress<false>["data"] {
    const location = getLocationFromMessage(context.message);
    const address: RenderResponseParsedAddress<false>["data"] = {
      formatted_address: getTextFromMessage(context.message) ||
        location.address || location.title || "",
      geometry: {
        location: {
          lat: location.location?.latitude || 0,
          lng: location.location?.longitude || 0,
        },
      },
    };
    return address;
  }

  public parseResponsesAddress(
    contexts: Context[],
  ): RenderResponseParsedAddress<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const addresses: RenderResponseParsedAddress<true>["data"] = contexts
      .filter((ctx) => ctx.message?.text).map(this.parseResponseAddress);

    return addresses;
  }

  public parseResponseAny(
    context: Context,
  ): RenderResponseParsedAny<false>["data"] {
    return this.parseResponseText(context) || this.parseResponseFile(context);
  }

  public parseResponsesAny(
    contexts: Context[],
  ): RenderResponseParsedAny<true>["data"] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    return contexts.filter((ctx) => ctx.message?.text).map(
      this.parseResponseAny,
    );
  }

  public responseNone(): RenderResponseParsedNone<false>["data"] {
    return null;
  }

  public responsesNone(): RenderResponseParsedNone<true>["data"] {
    return this.responseNone();
  }

  /**
   * Convert a render response to a callout answer
   * @returns
   */
  public parseResponse(
    context: Context,
    type: ParsedResponseType,
  ): RenderResponseParsed<false>["data"] {
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
        return this.parseResponseAny(context);
      case ParsedResponseType.NONE:
        return this.responseNone();
      default:
        throw new Error(`Unknown parse response type: "${type}"`);
    }
  }

  /**
   * Convert a render responses to a callout answer
   * @returns
   */
  public parseResponses(
    contexts: Context[],
    type: ParsedResponseType,
  ): RenderResponseParsed<true>["data"] {
    switch (type) {
      case ParsedResponseType.FILE:
        return this.parseResponsesFile(contexts);
      case ParsedResponseType.TEXT:
        return this.parseResponsesText(contexts);
      case ParsedResponseType.MULTI_SELECT:
        return this.parseResponsesMultiSelect(contexts);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponsesBoolean(contexts);
      case ParsedResponseType.NUMBER:
        return this.parseResponsesNumber(contexts);
      case ParsedResponseType.ADDRESS:
        return this.parseResponsesAddress(contexts);
      case ParsedResponseType.ANY:
        return this.parseResponsesAny(contexts);
      case ParsedResponseType.NONE:
        return this.responsesNone();
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
  protected groupResponsesByGroupKey(responses: RenderResponse<boolean>[]) {
    const slides: Record<string, RenderResponse<boolean>[]> = {};

    for (const response of responses) {
      // Ignore responses that are not parsed
      if (response.render.parseType === ParsedResponseType.NONE) {
        continue;
      }
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
  public parseCalloutFormResponses(
    responses: RenderResponse<boolean>[],
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

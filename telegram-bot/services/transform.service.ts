import { Singleton } from "../deps.ts";

import { ParsedResponseType, ReplayType } from "../enums/index.ts";
import { I18nService } from "../services/i18n.service.ts";
import {
  extractNumbers,
  getFileIdFromMessage,
  getLocationFromMessage,
  getTextFromMessage,
  isCalloutGroupKey,
  splitCalloutGroupKey,
} from "../utils/index.ts";

import type {
  Render,
  RenderResponse,
  RenderResponseParsed,
  RenderResponseParsedAny,
  RenderResponseParsedBoolean,
  RenderResponseParsedFile,
  RenderResponseParsedNone,
  RenderResponseParsedNumber,
  RenderResponseParsedSelection,
  RenderResponseParsedText,
  ReplayAccepted,
} from "../types/index.ts";

import type {
  CalloutResponseAnswer,
  CalloutResponseAnswersSlide,
} from "../deps.ts";
import { ReplayAcceptedCalloutComponentSchema } from "../types/index.ts";
import { Context } from "../types/grammy.ts";
import { CalloutResponseAnswerAddress } from "../../beabee-client/src/deps.ts";

/**
 * Service to transform message responses
 */
@Singleton()
export class TransformService {
  constructor(readonly i18n: I18nService) {
    console.debug(`${this.constructor.name} created`);
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
    const texts = contexts
      .filter((context) => context.message?.text)
      .map((context) => getTextFromMessage(context.message));

    return texts;
  }

  public parseResponseSelection(
    replay: ReplayAccepted,
    valueLabel: Record<string, string>,
    otherFalse = true,
  ): RenderResponseParsedSelection<false>["data"] {
    const res: RenderResponseParsedSelection<false>["data"] = {};

    if (replay.type !== ReplayType.SELECTION) {
      throw new Error(
        `Unsupported accepted type for selection: "${replay.type}"`,
      );
    }

    if (replay.value) {
      res[replay.value] = true;
    }

    // Set all values to false that are not selected
    if (otherFalse) {
      for (const value of Object.keys(valueLabel)) {
        res[value] ||= false;
      }
    }

    return res;
  }

  public parseResponsesSelection(
    replays: ReplayAccepted[],
    render: Render,
  ): RenderResponseParsedSelection<true>["data"] {
    if (render.accepted.type !== ReplayType.SELECTION) {
      throw new Error(
        `Unsupported accepted type for selection: "${render.parseType}"`,
      );
    }

    replays = Array.isArray(replays) ? replays : [replays];
    let res: RenderResponseParsedSelection<true>["data"] = {};

    for (
      const rpl of replays.filter(
        (replay) => replay.context.message?.text,
      )
    ) {
      res = {
        ...res,
        ...this.parseResponseSelection(rpl, render.accepted.valueLabel, false),
      };
    }

    // Set all values to false that are not selected
    for (const value of Object.keys(render.accepted.valueLabel)) {
      res[value] ||= false;
    }

    return res;
  }

  public parseResponseBoolean(
    context: Context,
  ): RenderResponseParsedBoolean<false>["data"] {
    const boolStr = getTextFromMessage(context.message).toLowerCase().trim();
    let bool = false;
    const truthyStr = this.i18n.t("bot.reactions.messages.truthy").toLowerCase()
      .trim();
    const falsyStr = this.i18n.t("bot.reactions.messages.falsy").toLowerCase()
      .trim();
    if (boolStr === truthyStr) {
      bool = true;
    } else if (boolStr === falsyStr) {
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
    const booleans = contexts
      .filter((context) => context.message?.text)
      .map(this.parseResponseBoolean);

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
    const texts = contexts
      .filter((context) => context.message?.text)
      .map(this.parseResponseNumber);

    return texts;
  }

  public parseResponseCalloutComponentAddress(
    context: Context,
  ): CalloutResponseAnswerAddress {
    const location = getLocationFromMessage(context.message);
    const address: CalloutResponseAnswerAddress = {
      formatted_address: getTextFromMessage(context.message) ||
        location.address ||
        location.title ||
        "",
      geometry: {
        location: {
          lat: location.location?.latitude || 0,
          lng: location.location?.longitude || 0,
        },
      },
    };
    return address;
  }

  public parseResponsesCalloutComponentAddress(
    contexts: Context[],
  ): CalloutResponseAnswerAddress[] {
    contexts = Array.isArray(contexts) ? contexts : [contexts];
    const addresses: CalloutResponseAnswerAddress[] = contexts
      .filter((context) => context.message?.text)
      .map(this.parseResponseCalloutComponentAddress);

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
    return contexts
      .filter((context) => context.message?.text)
      .map(this.parseResponseAny);
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
    replay: ReplayAccepted,
    render: Render,
  ): RenderResponseParsed<false>["data"] {
    switch (render.parseType) {
      case ParsedResponseType.CALLOUT_COMPONENT:
        if (replay.type !== ReplayType.CALLOUT_COMPONENT_SCHEMA) {
          throw new Error(
            `Unsupported accepted type for callout component: "${replay.type}"`,
          );
        }
        // Already parsed for validation
        return (replay as ReplayAcceptedCalloutComponentSchema).answer;
      case ParsedResponseType.FILE:
        return this.parseResponseFile(replay.context);
      case ParsedResponseType.TEXT:
        return this.parseResponseText(replay.context);
      case ParsedResponseType.SELECTION:
        if (render.accepted.type !== ReplayType.SELECTION) {
          throw new Error(
            `Unsupported accepted type for selection: "${render.accepted.type}"`,
          );
        }
        return this.parseResponseSelection(replay, render.accepted.valueLabel);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponseBoolean(replay.context);
      case ParsedResponseType.NUMBER:
        return this.parseResponseNumber(replay.context);
      case ParsedResponseType.ANY:
        return this.parseResponseAny(replay.context);
      case ParsedResponseType.NONE:
        return this.responseNone();
      default:
        throw new Error(`Unknown parse response type: "${render.parseType}"`);
    }
  }

  /**
   * Convert a render responses to a callout answer
   * @returns
   */
  public parseResponses(
    replays: ReplayAccepted[],
    render: Render,
  ): RenderResponseParsed<true>["data"] {
    const contexts = replays.map((replay) => replay.context);
    switch (render.parseType) {
      case ParsedResponseType.CALLOUT_COMPONENT:
        // Already parsed for validation
        return (replays as ReplayAcceptedCalloutComponentSchema[]).map(
          (r) => r.answer,
        );
      case ParsedResponseType.FILE:
        return this.parseResponsesFile(contexts);
      case ParsedResponseType.TEXT:
        return this.parseResponsesText(contexts);
      case ParsedResponseType.SELECTION:
        return this.parseResponsesSelection(replays, render);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponsesBoolean(contexts);
      case ParsedResponseType.NUMBER:
        return this.parseResponsesNumber(contexts);
      case ParsedResponseType.ANY:
        return this.parseResponsesAny(contexts);
      case ParsedResponseType.NONE:
        return this.responsesNone();
      default:
        throw new Error(`Unknown parse response type: "${render.parseType}"`);
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
  public parseCalloutFormResponses(responses: RenderResponse<boolean>[]) {
    const slideResponses = this.groupResponsesByGroupKey(responses);
    const answers: CalloutResponseAnswersSlide = {};
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

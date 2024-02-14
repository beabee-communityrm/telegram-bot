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
  CalloutResponseAnswer,
  CalloutResponseAnswers,
  Render,
  RenderResponse,
  RenderResponseParsed,
  RenderResponseParsedAddress,
  RenderResponseParsedAny,
  RenderResponseParsedBoolean,
  RenderResponseParsedFile,
  RenderResponseParsedNone,
  RenderResponseParsedNumber,
  RenderResponseParsedSelection,
  RenderResponseParsedText,
  ReplayAccepted,
} from "../types/index.ts";

/**
 * Service to transform message responses
 */
@Singleton()
export class TransformService {
  constructor(readonly i18n: I18nService) {
    console.debug(`${this.constructor.name} created`);
  }

  public parseResponseFile(
    replay: ReplayAccepted,
  ): RenderResponseParsedFile<false>["data"] {
    const fileId = getFileIdFromMessage(replay.context.message);
    if (!fileId) {
      throw new Error("No file id found in message");
    }
    return {
      // TODO: Get the file from the telegram api and upload it to beabee api and use the new url here
      url: fileId,
    };
  }

  public parseResponsesFile(
    replays: ReplayAccepted[],
  ): RenderResponseParsedFile<true>["data"] {
    replays = Array.isArray(replays) ? replays : [replays];
    const res = replays.map(this.parseResponseFile);
    return res;
  }

  public parseResponseText(
    replay: ReplayAccepted,
  ): RenderResponseParsedText<false>["data"] {
    return getTextFromMessage(replay.context.message);
  }

  public parseResponsesText(
    replays: ReplayAccepted[],
  ): RenderResponseParsedText<true>["data"] {
    replays = Array.isArray(replays) ? replays : [replays];
    const texts = replays.filter((replay) => replay.context.message?.text)
      .map((
        replay,
      ) => getTextFromMessage(replay.context.message));

    return texts;
  }

  public parseResponseSelection(
    replay: ReplayAccepted,
    render: Render,
    otherFalse = true,
  ): RenderResponseParsedSelection<false>["data"] {
    if (render.accepted.type !== ReplayType.SELECTION) {
      throw new Error(
        `Unsupported accepted type for selection: "${render.parseType}"`,
      );
    }

    const res: RenderResponseParsedSelection<false>["data"] = {};

    if (replay.type !== ReplayType.SELECTION || !replay.value) {
      console.warn(
        `Unsupported replay type for multi selection: "${render.accepted.type}"`,
      );
      const value = getTextFromMessage(replay.context.message);
      res[value] = true;
      return res;
    }

    res[replay.value] = true;

    // Set all values to false that are not selected
    if (otherFalse) {
      for (const value of Object.keys(render.accepted.valueLabel)) {
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
      const ctx of replays.filter((replay) => replay.context.message?.text)
    ) {
      res = { ...res, ...this.parseResponseSelection(ctx, render, false) };
    }

    // Set all values to false that are not selected
    for (const value of Object.keys(render.accepted.valueLabel)) {
      res[value] ||= false;
    }

    return res;
  }

  public parseResponseBoolean(
    replay: ReplayAccepted,
  ): RenderResponseParsedBoolean<false>["data"] {
    const boolStr = getTextFromMessage(replay.context.message).toLowerCase();
    let bool = false;
    const truthyStr = this.i18n.t("bot.reactions.messages.truthy").toLowerCase();
    const falsyStr = this.i18n.t("bot.reactions.messages.falsy").toLowerCase();
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
    replays: ReplayAccepted[],
  ): RenderResponseParsedBoolean<true>["data"] {
    replays = Array.isArray(replays) ? replays : [replays];
    const booleans = replays.filter((replay) => replay.context.message?.text)
      .map(
        this.parseResponseBoolean,
      );

    return booleans;
  }

  public parseResponseNumber(
    replay: ReplayAccepted,
  ): RenderResponseParsedNumber<false>["data"] {
    const text = getTextFromMessage(replay.context.message);
    return extractNumbers(text);
  }

  public parseResponsesNumber(
    replays: ReplayAccepted[],
  ): RenderResponseParsedNumber<true>["data"] {
    replays = Array.isArray(replays) ? replays : [replays];
    const texts = replays.filter((replay) => replay.context.message?.text).map(
      this.parseResponseNumber,
    );

    return texts;
  }

  public parseResponseAddress(
    replay: ReplayAccepted,
  ): RenderResponseParsedAddress<false>["data"] {
    const location = getLocationFromMessage(replay.context.message);
    const address: RenderResponseParsedAddress<false>["data"] = {
      formatted_address: getTextFromMessage(replay.context.message) ||
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
    replays: ReplayAccepted[],
  ): RenderResponseParsedAddress<true>["data"] {
    replays = Array.isArray(replays) ? replays : [replays];
    const addresses: RenderResponseParsedAddress<true>["data"] = replays
      .filter((replay) => replay.context.message?.text).map(
        this.parseResponseAddress,
      );

    return addresses;
  }

  public parseResponseAny(
    context: ReplayAccepted,
  ): RenderResponseParsedAny<false>["data"] {
    return this.parseResponseText(context) || this.parseResponseFile(context);
  }

  public parseResponsesAny(
    replays: ReplayAccepted[],
  ): RenderResponseParsedAny<true>["data"] {
    replays = Array.isArray(replays) ? replays : [replays];
    return replays.filter((replay) => replay.context.message?.text).map(
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
    replay: ReplayAccepted,
    render: Render,
  ): RenderResponseParsed<false>["data"] {
    switch (render.parseType) {
      case ParsedResponseType.FILE:
        return this.parseResponseFile(replay);
      case ParsedResponseType.TEXT:
        return this.parseResponseText(replay);
      case ParsedResponseType.SELECTION:
        return this.parseResponseSelection(replay, render);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponseBoolean(replay);
      case ParsedResponseType.NUMBER:
        return this.parseResponseNumber(replay);
      case ParsedResponseType.ADDRESS:
        return this.parseResponseAddress(replay);
      case ParsedResponseType.ANY:
        return this.parseResponseAny(replay);
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
    switch (render.parseType) {
      case ParsedResponseType.FILE:
        return this.parseResponsesFile(replays);
      case ParsedResponseType.TEXT:
        return this.parseResponsesText(replays);
      case ParsedResponseType.SELECTION:
        return this.parseResponsesSelection(replays, render);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponsesBoolean(replays);
      case ParsedResponseType.NUMBER:
        return this.parseResponsesNumber(replays);
      case ParsedResponseType.ADDRESS:
        return this.parseResponsesAddress(replays);
      case ParsedResponseType.ANY:
        return this.parseResponsesAny(replays);
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

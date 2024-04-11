import { BaseService } from "../core/index.ts";
import {
  CalloutResponseAnswerAddress,
  Message,
  Singleton,
  Update,
} from "../deps/index.ts";

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
} from "../deps/index.ts";
import { ReplayAcceptedCalloutComponentSchema } from "../types/index.ts";

/**
 * Service to transform message responses
 */
@Singleton()
export class TransformService extends BaseService {
  constructor(readonly i18n: I18nService) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public parseResponseFile(
    message?: Message,
  ): RenderResponseParsedFile<false>["data"] {
    const fileId = getFileIdFromMessage(message);
    if (!fileId) {
      throw new Error("No file id found in message");
    }
    return {
      // TODO: Get the file from the telegram api and upload it to beabee api and use the new url here
      url: fileId,
    };
  }

  public parseResponsesFile(
    messages: Message[],
  ): RenderResponseParsedFile<true>["data"] {
    const res = messages.map(this.parseResponseFile);
    return res;
  }

  public parseResponseText(
    message?: string,
  ): RenderResponseParsedText<false>["data"] {
    return message?.trim() || "";
  }

  public parseResponsesText(
    messages: string[],
  ): RenderResponseParsedText<true>["data"] {
    const texts = messages
      .filter((message) => message !== undefined)
      .map((message) => message.trim());

    return texts;
  }

  /**
   * @param replay
   * @param valueLabel
   * @param otherFalse If every unselected value should be set to false
   * @returns
   */
  public parseResponseSelection(
    replay: ReplayAccepted,
    valueLabel: Record<string, string>,
    otherFalse = true,
  ): RenderResponseParsedSelection<false>["data"] {
    const res: RenderResponseParsedSelection<false>["data"] = {};

    if (replay.isSkipMessage) {
      if (otherFalse) {
        for (const value of Object.keys(valueLabel)) {
          res[value] ||= false;
        }
      }
      return res;
    }

    if (replay.type !== ReplayType.SELECTION) {
      const error = new Error(
        `Unsupported accepted type for selection: "${replay.type}"`,
      );
      console.error(error, replay);
      throw error;
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
    message?: string,
  ): RenderResponseParsedBoolean<false>["data"] {
    const boolStr = message?.trim().toLowerCase();
    let bool = false;
    if (boolStr === undefined) {
      return bool;
    }
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
    messages: string[],
  ): RenderResponseParsedBoolean<true>["data"] {
    const booleans = messages
      .filter((message) => message !== undefined)
      .map(this.parseResponseBoolean);

    return booleans;
  }

  public parseResponseNumber(
    message?: string,
  ): RenderResponseParsedNumber<false>["data"] {
    return extractNumbers(message?.trim());
  }

  public parseResponsesNumber(
    messages: string[],
  ): RenderResponseParsedNumber<true>["data"] {
    const texts = messages
      .filter((message) => message !== undefined)
      .map(this.parseResponseNumber);

    return texts;
  }

  // TODO: Use CalloutComponentInputAddressSchema as return type
  public parseResponseCalloutComponentAddress(
    message?: Message,
  ): CalloutResponseAnswerAddress {
    const location = getLocationFromMessage(message);
    const address: CalloutResponseAnswerAddress = {
      formatted_address: getTextFromMessage(message) ||
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

  // TODO: Use CalloutComponentInputAddressSchema as return type
  public parseResponsesCalloutComponentAddress(
    messages: Message[],
  ): CalloutResponseAnswerAddress[] {
    const addresses: CalloutResponseAnswerAddress[] = messages
      .filter((message) => message.text)
      .map(this.parseResponseCalloutComponentAddress);

    return addresses;
  }

  public parseResponseCalloutComponentInputUrl(
    message?: string,
  ): string {
    let text = this.parseResponseText(message?.toLowerCase());
    if (!text.startsWith("http")) {
      text = `https://${text}`;
    }
    return text;
  }

  public parseResponseAny(
    message?: Message,
  ): RenderResponseParsedAny<false>["data"] {
    return this.parseResponseText(message?.text) ||
      this.parseResponseFile(message);
  }

  public parseResponsesAny(
    messages: Message[],
  ): RenderResponseParsedAny<true>["data"] {
    return messages
      .filter((message) => message.text)
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
    // Check if message was skipped
    if (replay?.isSkipMessage) {
      if (render.accepted.required) {
        throw new Error("Skip message is not allowed");
      }
      return this.responseNone();
    }

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
        return this.parseResponseFile(replay.context.message);
      case ParsedResponseType.TEXT:
        return this.parseResponseText(replay.context.message?.text);
      case ParsedResponseType.SELECTION:
        if (render.accepted.type !== ReplayType.SELECTION) {
          throw new Error(
            `Unsupported accepted type for selection: "${render.accepted.type}"`,
          );
        }
        return this.parseResponseSelection(replay, render.accepted.valueLabel);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponseBoolean(replay.context.message?.text);
      case ParsedResponseType.NUMBER:
        return this.parseResponseNumber(replay.context.message?.text);
      case ParsedResponseType.ANY:
        return this.parseResponseAny(replay.context.message);
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
    const messages = contexts.filter((c) => c.message).map((c) =>
      c.message as (Message & Update.NonChannel)
    );
    const textMessages = messages.filter((m) => m.text).map((m) =>
      m.text as string
    );
    switch (render.parseType) {
      case ParsedResponseType.CALLOUT_COMPONENT:
        // Already parsed for validation
        return (replays as ReplayAcceptedCalloutComponentSchema[]).map(
          (r) => r.answer,
        );
      case ParsedResponseType.FILE:
        return this.parseResponsesFile(messages);
      case ParsedResponseType.TEXT:
        return this.parseResponsesText(textMessages);
      case ParsedResponseType.SELECTION:
        return this.parseResponsesSelection(replays, render);
      case ParsedResponseType.BOOLEAN:
        return this.parseResponsesBoolean(textMessages);
      case ParsedResponseType.NUMBER:
        return this.parseResponsesNumber(textMessages);
      case ParsedResponseType.ANY:
        return this.parseResponsesAny(messages);
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
        slideAnswers[key] = response.responses.type === ParsedResponseType.NONE
          ? undefined
          : response.responses.data;
      }
      answers[slideId] = slideAnswers;
    }

    return answers;
  }
}

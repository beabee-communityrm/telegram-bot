import { CalloutClient } from "@beabee/client";
import { ItemStatus } from "@beabee/beabee-common";
import { Singleton } from "alosaur/mod.ts";
import { CalloutComponentMainType } from "../enums/index.ts";
import {
  getComponentMainType,
  getFileIdFromMessage,
  getTextFromMessage,
  isCalloutGroupKey,
  splitCalloutGroupKey,
  truncateSlug,
} from "../utils/index.ts";

import type {
  CalloutData,
  GetCalloutData,
  GetCalloutDataWith,
  GetCalloutsQuery,
  GetCalloutWith,
} from "@beabee/client";
import type {
  CalloutDataExt,
  CalloutResponseAnswer,
  CalloutResponseAnswers,
  GetCalloutDataExt,
  GetCalloutDataWithExt,
  NestableCalloutComponentSchema,
  RenderResponse,
} from "../types/index.ts";
import type { Paginated } from "@beabee/beabee-common";

const CALLOUTS_ACTIVE_QUERY: GetCalloutsQuery = {
  rules: {
    condition: "AND",
    rules: [
      { field: "status", operator: "equal", value: [ItemStatus.Open] },
      { field: "expires", operator: "is_empty", value: [] },
    ],
  },
};

@Singleton()
export class CalloutService {
  /**
   * A map of short slugs to slugs for callouts as a WORKAROUND for too long callback data.
   */
  protected readonly shortSlugs = new Map<string, string>();

  public readonly client: CalloutClient;

  public readonly baseUrl: URL;

  constructor() {
    const host = Deno.env.get("BEABEE_API_BASE_HOST") ||
      "http://localhost:3001";
    const path = Deno.env.get("BEABEE_API_BASE_PATH") || "/api/1.0/";
    const token = Deno.env.get("BEABEE_API_TOKEN");
    const baseUrl = Deno.env.get("CALLOUTS_BASE_URL") ||
      "http://localhost:3000/callouts";

    if (!token) {
      throw new Error("BEABEE_API_TOKEN is required");
    }

    this.client = new CalloutClient({ path, host, token });
    this.baseUrl = new URL(baseUrl);
    console.debug(`${CalloutService.name} created`);
  }

  protected getUrl(slug: string) {
    return new URL(slug, this.baseUrl);
  }

  protected extend<With extends GetCalloutWith = void>(
    callout: GetCalloutDataWith<With>,
  ): GetCalloutDataWithExt<With>;
  protected extend(callout: GetCalloutData): GetCalloutDataExt;
  protected extend(callout: CalloutData): CalloutDataExt {
    const shortSlug = callout.slug ? truncateSlug(callout.slug) : "";
    if (callout.slug && shortSlug) {
      this.shortSlugs.set(shortSlug, callout.slug);
    }
    return {
      ...callout,
      url: callout.slug ? this.getUrl(callout.slug).toString() : null,
      shortSlug,
    };
  }

  public getSlug(shortSlug: string) {
    return this.shortSlugs.get(shortSlug);
  }

  /**
   * Get a callout
   * @param slug The slug of the callout to get
   * @param _with The relations to include
   * @returns The callout
   */
  public async get<With extends GetCalloutWith = void>(
    slug: string,
    _with?: readonly With[],
  ) {
    const callout = await this.client.get(slug, _with);
    return this.extend(callout);
  }

  public async list(limit = 10) {
    const data = await this.client.list({
      ...CALLOUTS_ACTIVE_QUERY,
      limit,
      sort: "title",
    });
    const callouts: Paginated<GetCalloutDataExt> = {
      ...data,
      items: data.items.map((item) => this.extend(item)),
    };

    return callouts;
  }

  /**
   * Get the file id from an input response.
   * TODO: Download the file from the telegram api?
   * @param response
   * @returns
   */
  public fileResponseToAnswer(response: RenderResponse) {
    const fileIds = response.responses.map((ctx) =>
      getFileIdFromMessage(ctx.message)
    );
    return fileIds;
  }

  /**
   * Get the text from an input response
   * @param response
   * @returns
   */
  public inputResponseToAnswer(response: RenderResponse) {
    const texts = response.responses.filter((ctx) => ctx.message?.text).map((
      ctx,
    ) => getTextFromMessage(ctx.message));

    return texts;
  }

  /**
   * Get the selected option from a radio response
   * TODO: Convert text to option value
   * @param response
   * @returns
   */
  public radioResponseToAnswer(response: RenderResponse) {
    const texts = response.responses.filter((ctx) => ctx.message?.text).map((
      ctx,
    ) => getTextFromMessage(ctx.message));

    return texts;
  }

  /**
   * Get the selected option from a select response
   * TODO: Convert text to option value
   * @param response
   * @returns
   */
  public selectResponseToAnswer(response: RenderResponse) {
    const texts = response.responses.filter((ctx) => ctx.message?.text).map((
      ctx,
    ) => getTextFromMessage(ctx.message));

    return texts;
  }

  /**
   * Get a component from a callout form by key
   * - If the key is a group key, the slide id and component key are extracted
   * - If the key is not a group key, the `slideId` is expected to be provided
   * @param calloutForm
   * @param componentKey
   * @param slideId
   * @returns
   */
  public getComponent(
    calloutForm: GetCalloutDataWithExt<"form">,
    componentKey: string,
    slideId?: string,
  ) {
    if (isCalloutGroupKey(componentKey)) {
      [slideId, componentKey] = splitCalloutGroupKey(componentKey);
    }

    // TODO: If not slide id is provided, we can search in all slides
    if (!slideId) {
      return null;
    }

    const slide = calloutForm.formSchema.slides.find((s) => s.id === slideId);
    if (!slide) {
      return null;
    }

    const component = slide.components.find((c) => {
      if (c.key === componentKey) {
        return true;
      }
      // Also check nested components
      if ((c as NestableCalloutComponentSchema).components) {
        return (c as NestableCalloutComponentSchema).components.find((c) =>
          c.key === componentKey
        );
      }
      return false;
    });
    if (!component) {
      return null;
    }

    return component;
  }

  /**
   * Convert a render response to a callout answer
   * @param calloutForm The callout form
   * @param response The response to convert
   * @returns
   */
  public responseToAnswer(
    calloutForm: GetCalloutDataWithExt<"form">,
    response: RenderResponse,
  ) {
    const component = this.getComponent(calloutForm, response.render.key);
    if (!component) {
      throw new Error(`Component not found for key ${response.render.key}`);
    }

    const mainType = getComponentMainType(component);

    switch (mainType) {
      case CalloutComponentMainType.FILE:
        return this.fileResponseToAnswer(response);
      case CalloutComponentMainType.INPUT:
        return this.inputResponseToAnswer(response);
      case CalloutComponentMainType.RADIO:
        return this.radioResponseToAnswer(response);
      case CalloutComponentMainType.SELECT:
        return this.selectResponseToAnswer(response);
      case CalloutComponentMainType.NESTED:
        throw new Error(
          "Nested components are just wrappers for other components and have no answers",
        );
      default:
        throw new Error(`Unknown component type ${mainType}`);
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
  protected groupResponsesBySlide(responses: RenderResponse[]) {
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
   * @param calloutForm The callout form
   * @param responses The responses to convert
   * @returns
   */
  public responsesToAnswers(
    calloutForm: GetCalloutDataWithExt<"form">,
    responses: RenderResponse[],
  ) {
    const slideResponses = this.groupResponsesBySlide(responses);
    const answers: CalloutResponseAnswers = {};
    for (const [slideId, responses] of Object.entries(slideResponses)) {
      const slideAnswers: Record<
        string,
        CalloutResponseAnswer | CalloutResponseAnswer[]
      > = {};
      for (const response of responses) {
        const [_, key] = splitCalloutGroupKey(response.render.key);
        const answers = this.responseToAnswer(calloutForm, response);
        slideAnswers[key] = answers;
      }
      answers[slideId] = slideAnswers;
    }

    return answers;
  }
}

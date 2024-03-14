import { BaseService } from "../core/index.ts";
import {
  CalloutClient,
  CalloutResponseClient,
  ItemStatus,
  Singleton,
} from "../deps/index.ts";
import {
  isCalloutGroupKey,
  splitCalloutGroupKey,
  truncateSlug,
} from "../utils/index.ts";

import type {
  CalloutData,
  CalloutDataExt,
  CreateCalloutResponseData,
  GetCalloutData,
  GetCalloutDataExt,
  GetCalloutDataWith,
  GetCalloutDataWithExt,
  GetCalloutsQuery,
  GetCalloutWith,
} from "../types/index.ts";

import type {
  CalloutComponentNestableSchema,
  Paginated,
} from "../deps/index.ts";

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
export class CalloutService extends BaseService {
  /**
   * A map of short slugs to slugs for callouts as a WORKAROUND for too long callback data.
   */
  protected readonly shortSlugs = new Map<string, string>();

  public readonly client: CalloutClient;

  public readonly responseClient: CalloutResponseClient;

  public readonly baseUrl: URL;

  constructor() {
    super();
    const host = Deno.env.get("API_PROXY_URL") ||
      Deno.env.get("BEABEE_AUDIENCE") ||
      "http://localhost:3001";
    const path = Deno.env.get("API_BASE_URL") || "/api/1.0/";
    const token = Deno.env.get("BEABEE_API_TOKEN");
    const baseUrl = Deno.env.get("BEABEE_AUDIENCE") ||
      "http://localhost:3000";
    const basePath = "/callouts";

    if (!token) {
      throw new Error("BEABEE_API_TOKEN is required");
    }

    this.client = new CalloutClient({ path, host, token });
    this.responseClient = new CalloutResponseClient({ path, host, token });
    this.baseUrl = new URL(basePath, baseUrl);
    console.debug(`${this.constructor.name} created`);
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

    // TODO: If no slide id is provided, we can search in all slides
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
      if ((c as CalloutComponentNestableSchema).components) {
        return (c as CalloutComponentNestableSchema).components.find((c) =>
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

  public async createResponse(
    slug: string,
    newData: Pick<
      CreateCalloutResponseData,
      "answers" | "guestEmail" | "guestName"
    >,
  ) {
    const response = await this.responseClient.create(slug, newData);
    return response;
  }
}

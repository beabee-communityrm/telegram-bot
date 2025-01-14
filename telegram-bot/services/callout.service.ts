import { BaseService } from "../core/index.ts";
import {
  CalloutClient,
  CalloutResponseClient,
  ItemStatus,
  Singleton,
} from "../deps/index.ts";
import { isCalloutGroupKey, splitCalloutGroupKey } from "../utils/index.ts";

import type {
  GetCalloutDataExt,
  GetCalloutDataWithExt,
} from "../types/index.ts";

import type {
  CalloutComponentNestableSchema,
  CreateCalloutResponseData,
  GetCalloutData,
  GetCalloutDataWith,
  GetCalloutsQuery,
  GetCalloutWith,
  Paginated,
} from "../deps/index.ts";

const CALLOUTS_ACTIVE_TELEGRAM_QUERY: GetCalloutsQuery = {
  rules: {
    condition: "AND",
    rules: [
      { field: "status", operator: "equal", value: [ItemStatus.Open] },
      { field: "expires", operator: "is_empty", value: [] },
      { field: "hidden", operator: "equal", value: [false] },
      { field: "channels", operator: "contains", value: ["telegram"] },
      // TODO: Add access filter to the API
      // { field: "access", operator: "equal", value: ["anonymous"] },
    ],
  },
};

@Singleton()
export class CalloutService extends BaseService {
  protected readonly client: CalloutClient;

  protected readonly responseClient: CalloutResponseClient;

  protected baseUrl?: URL;

  protected readonly basePath = "/callouts";

  constructor() {
    super();
    const host = Deno.env.get("API_PROXY_URL") ||
      Deno.env.get("BEABEE_AUDIENCE") ||
      "http://localhost:3001";
    const path = Deno.env.get("API_BASE_URL") || "/api/1.0/";
    const token = Deno.env.get("BEABEE_API_TOKEN");
    this.baseUrl = new URL(
      Deno.env.get("BEABEE_AUDIENCE") ||
        "http://localhost:3000",
    );

    if (!token) {
      throw new Error("BEABEE_API_TOKEN is required");
    }

    this.client = new CalloutClient({ path, host, token });
    this.responseClient = new CalloutResponseClient({ path, host, token });

    console.debug(`${this.constructor.name} created`);
  }

  protected getUrl(slug: string) {
    if (!this.baseUrl) {
      throw new Error("Base URL not initialized");
    }

    const url = new URL(this.basePath + "/" + slug, this.baseUrl);
    console.debug(`Callout URL: ${url}`);
    return url;
  }

  protected extend<With extends GetCalloutWith = void>(
    callout: GetCalloutDataWith<With>,
  ): GetCalloutDataWithExt<With>;
  protected extend(callout: GetCalloutData): GetCalloutDataExt {
    return {
      ...callout,
      url: callout.slug ? this.getUrl(callout.slug).toString() : null,
    };
  }

  /**
   * Get a callout
   * @param slugOrId The slug or id of the callout to get
   * @param _with The relations to include
   * @returns The callout
   */
  public async get<With extends GetCalloutWith = void>(
    slugOrId: string,
    _with?: readonly With[],
  ) {
    const callout = await this.client.get(slugOrId, _with);
    return this.extend(callout);
  }

  public async list(limit = 10) {
    const data = await this.client.list({
      ...CALLOUTS_ACTIVE_TELEGRAM_QUERY,
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

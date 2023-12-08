import { CalloutClient } from "@beabee/client";
import { ItemStatus } from "@beabee/beabee-common";
import { Singleton } from "alosaur/mod.ts";
import { truncateSlug } from "../utils/index.ts";

import type {
  CalloutData,
  GetCalloutData,
  GetCalloutDataWith,
  GetCalloutsQuery,
  GetCalloutWith,
} from "@beabee/client";
import type {
  CalloutDataExt,
  GetCalloutDataExt,
  GetCalloutDataWithExt,
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
}

import { BaseService } from "../core/index.ts";
import { ContentClient, Singleton } from "../deps.ts";

import type { Content, ContentId } from "../types/index.ts";

@Singleton()
export class BeabeeContentService extends BaseService {
  public readonly client: ContentClient;
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

    this.client = new ContentClient({ path, host, token });
    this.baseUrl = new URL(basePath, baseUrl);
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Get a content from the API
   * @param id The content id
   */
  public async get<Id extends ContentId>(
    id: Id,
  ) {
    return await this.client.get(id);
  }

  /**
   * Update a content
   * @param id The content id
   * @param content The content to update
   */
  public async update<Id extends ContentId>(
    id: Id,
    content: Partial<Content<Id>>,
  ) {
    return await this.client.update(id, content);
  }
}

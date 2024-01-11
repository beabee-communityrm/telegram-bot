import { BaseClient } from "./base-client.ts";
import { cleanUrl } from "../utils/index.ts";

import type { BaseClientOptions, Content, ContentId } from "../types/index.ts";

export class ContentClient extends BaseClient {
  constructor(protected readonly options: BaseClientOptions) {
    // e.g. `/api/1.0/content`
    options.path = cleanUrl(options.path + "/content");
    super(options);
  }

  protected deserialize<Id extends ContentId>(content: Content<Id>) {
    return content;
  }

  async get<Id extends ContentId>(
    id: Id,
  ) {
    const { data } = await this.fetch.get<Content<Id>>(
      `/${id}`,
    );
    return this.deserialize(data);
  }

  async update<Id extends ContentId>(id: Id, content: Partial<Content<Id>>) {
    return await this.fetch.patch(
      `/${id}`,
      content,
    );
  }
}

import { ContentClient, Singleton } from "../deps.ts";
import { deepEqual } from "../utils/index.ts";
import { EventService } from "./event.service.ts";
import { BeabeeContentEventName } from "../enums/index.ts";

import type {
  Content,
  ContentId,
  EventBeabeeContentChangedData,
} from "../types/index.ts";

@Singleton()
export class BeabeeContentService {
  public readonly client: ContentClient;
  public readonly baseUrl: URL;

  protected _timer: { [key in ContentId]?: ReturnType<typeof setInterval> } =
    {};

  protected _cache: { [key in ContentId]?: Content<key> } = {};

  constructor(
    protected readonly event: EventService,
  ) {
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

  public async get<Id extends ContentId>(
    id: Id,
  ) {
    if (this._cache[id]) {
      return this._cache[id] as Content<Id>;
    }
    // We don't set the cache here because we want to be able to watch the content
    // If we want caching, we should change the current implementation of the watch method
    return await this.client.get(id);
  }

  /**
   * Watch a content for changes by polling the API
   * @param id
   * @param interval
   */
  public watch<Id extends ContentId>(
    id: Id,
    interval = 5000,
  ) {
    if (this._timer[id]) {
      console.warn(`[${this.constructor.name}] Already watching ${id}`);
      clearInterval(this._timer[id]);
    }

    this._timer[id] = setInterval(async () => {
      try {
        const data = await this.client.get<Id>(id);
        if (!deepEqual(data, this._cache[id])) {
          this.emitContentChange(id, data, this._cache[id] as Content<Id>);

          // FIXME: Remove any
          // deno-lint-ignore no-explicit-any
          this._cache[id] = data as any;
        }
      } catch (error) {
        console.error(`Error while watching ${id} content`, error);
      }
    }, interval);
  }

  /**
   * Stop watching a content / polling the API
   * @param id
   */
  public unwatch<Id extends ContentId>(
    id: Id,
  ) {
    if (this._timer[id]) {
      clearInterval(this._timer[id]);
      delete this._timer[id];
    }
  }

  public async update<Id extends ContentId>(
    id: Id,
    content: Partial<Content<Id>>,
  ) {
    return await this.client.update(id, content);
  }

  protected emitContentChange<Id extends ContentId>(
    id: Id,
    newContent: Content<Id>,
    oldContent: Content<Id>,
  ) {
    this.event.emit<EventBeabeeContentChangedData<Id>>(
      `beabee-content:${id}:changed` as BeabeeContentEventName,
      {
        newContent,
        oldContent,
      },
    );
  }
}

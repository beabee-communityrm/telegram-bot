import { Fetch } from '../utils/index.ts';
import type { BaseClientOptions } from '../types/index.ts';

export abstract class BaseClient {

  public readonly host: URL;

  protected readonly fetch: Fetch;

  constructor(protected readonly options: BaseClientOptions) {
    this.host = new URL(options.path || '/', options.host);
    this.fetch = new Fetch(options.token);
    this.init();
  }

  async init() {
    // const res = await this.fetch.get(this.host)
    // console.log(res.data)
  }
  // ...
}
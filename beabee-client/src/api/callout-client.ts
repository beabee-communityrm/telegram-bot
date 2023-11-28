import { BaseClient } from './base-client.ts';

import type { GetCalloutWith, Serial, GetCalloutDataWith, BaseClientOptions } from '../types/index.ts';
import type { Paginated } from '@beabee/beabee-common';

export class CalloutClient extends BaseClient {

    constructor(protected readonly options: BaseClientOptions) {
        options.path = (options.path + '/callout').replaceAll('//', '/');
        super(options);
    }

    async get<With extends GetCalloutWith = void>(slug: string, _with?: readonly With[]) {
        const { data } = await this.fetch.get<Paginated<Serial<GetCalloutDataWith<With>>>>(
            `${this.host}/${slug}`,
            { params: { with: _with } }
        );
        return data;
    }

    async list<With extends GetCalloutWith = void>(_with?: readonly With[]) {
        console.debug("list", this.host, _with)
        const { data } = await this.fetch.get<Paginated<Serial<GetCalloutDataWith<With>>>>(
            this.host,
            {},
            { isAjax: true }
            // { with: _with }
        );
        return data;
    }
} 
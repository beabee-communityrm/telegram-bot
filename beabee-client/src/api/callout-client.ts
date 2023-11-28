import { BaseClient } from './base-client.ts';

import type { GetCalloutWith, Serial, GetCalloutData, GetCalloutDataWith, BaseClientOptions, CreateCalloutData, UpdateCalloutData } from '../types/index.ts';
import type { Paginated } from '@beabee/beabee-common';

export class CalloutClient extends BaseClient {

    constructor(protected readonly options: BaseClientOptions) {
        // e.g. `/api/1.0/callout`
        options.path = (options.path + '/callout').replaceAll('//', '/');
        super(options);
    }

    protected deserialize(callout: any) {
        return {
            ...callout,
            starts: this.deserializeDate(callout.starts),
            expires: this.deserializeDate(callout.expires),
        };
    }

    async get<With extends GetCalloutWith = void>(slug: string, _with?: readonly With[]) {
        const { data } = await this.fetch.get<Serial<GetCalloutDataWith<With>>>(
            `/${slug}`,
            { with: _with }
        );
        return this.deserialize(data);
    }

    async list<With extends GetCalloutWith = void>(_with?: readonly With[]): Promise<Paginated<GetCalloutDataWith<With>>> {
        const { data } = await this.fetch.get<Paginated<Serial<GetCalloutDataWith<With>>>>(
            '/',
            { with: _with },
        );
        console.debug("data", data);
        return {
            ...data,
            items: data.items.map(this.deserialize),
        };
    }

    async create(newData: CreateCalloutData) {
        const { data } = await this.fetch.post<Serial<GetCalloutData>>(
            '/',
            newData
        );
        return data;
    }

    async update(slug: string, updateData: UpdateCalloutData) {
        const { data } = await this.fetch.patch<Serial<GetCalloutData>>(
            '/' + slug,
            updateData
        );
        return this.deserialize(data);
    }

    async delete(slug: string) {
        await this.fetch.delete(
            '/' + slug
        );
    }
}
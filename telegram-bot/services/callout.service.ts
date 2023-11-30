import { CalloutClient } from '@beabee/client';
import { ItemStatus } from '@beabee/beabee-common';
import { Injectable } from 'alosaur/mod.ts';

import type {
    CalloutData, GetCalloutsQuery, GetCalloutData
} from '@beabee/client';
import type { CalloutDataExt, GetCalloutDataExt } from '../types/index.ts';
import type { Paginated } from '@beabee/beabee-common';

const CALLOUTS_ACTIVE_QUERY: GetCalloutsQuery = {
    rules: {
        condition: 'AND',
        rules: [
            { field: 'status', operator: 'equal', value: [ItemStatus.Open] },
            { field: 'expires', operator: 'is_empty', value: [] },
        ],
    },
}

@Injectable()
export class CalloutService {

    public readonly client: CalloutClient;

    public readonly baseUrl: URL;

    constructor() {
        const host = Deno.env.get("BEABEE_API_BASE_HOST") || "http://localhost:3001";
        const path = Deno.env.get("BEABEE_API_BASE_PATH") || "/api/1.0/";
        const token = Deno.env.get("BEABEE_API_TOKEN");
        const baseUrl = Deno.env.get("CALLOUTS_BASE_URL") || "http://localhost:3000/callouts";

        if (!token) {
            throw new Error("BEABEE_API_TOKEN is required");
        }

        this.client = new CalloutClient({ path, host, token });
        this.baseUrl = new URL(baseUrl);
    }

    protected getUrl(slug: string) {
        return new URL(slug, this.baseUrl);
    }

    protected extend(callout: GetCalloutData): GetCalloutDataExt
    protected extend(callout: CalloutData): CalloutDataExt {
        return {
            ...callout,
            url: callout.slug ? this.getUrl(callout.slug).toString() : null,
        }
    }

    /**
     * Get a callout
     * @param slug The slug of the callout to get
     * @returns The callout
     */
    public async get(slug: string) {
        const callout = await this.client.get(slug);
        return this.extend(callout);
    }

    public async list(limit = 10) {
        const data = await this.client.list({
            ...CALLOUTS_ACTIVE_QUERY,
            limit,
            sort: 'title',
        });
        const callouts: Paginated<GetCalloutDataExt> = {
            ...data,
            items: data.items.map((item) => this.extend(item)),
        };

        return callouts;
    }
}
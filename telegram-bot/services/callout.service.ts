import { CalloutClient } from '@beabee/client';
import { ItemStatus } from '@beabee/beabee-common';
import { Singleton } from 'alosaur/mod.ts';
import { escapeMd } from '../utils/index.ts';

import type { CalloutData, GetCalloutsQuery } from '@beabee/client';

const CALLOUTS_ACTIVE_QUERY: GetCalloutsQuery = {
    rules: {
        condition: 'AND',
        rules: [
            { field: 'status', operator: 'equal', value: [ItemStatus.Open] },
            { field: 'expires', operator: 'is_empty', value: [] },
        ],
    },
}

@Singleton()
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

    protected createListItem(callout: CalloutData, listChar: string = '\\-') {
        listChar = escapeMd(listChar);
        if (callout.slug) {
            return `${listChar} [${escapeMd(callout.title)}](${this.getUrl(callout.slug)})\n`;
        } else {
            return `${listChar} ${escapeMd(callout.title)}\n`;
        }

    }

    protected createListItems(callouts: CalloutData[]) {
        let text = `*List of active callouts*\n\n`;
        let p = 1;
        for (const callout of callouts) {
            text += `${this.createListItem(callout, `${p}.`)}`;
        }

        return text;
    }

    public async list() {
        const callouts = await this.client.list({
            ...CALLOUTS_ACTIVE_QUERY,
            limit: 100,
            sort: 'title',
        });
        if (callouts.items.length === 0) return 'No active callouts';
        return this.createListItems(callouts.items);
    }
}
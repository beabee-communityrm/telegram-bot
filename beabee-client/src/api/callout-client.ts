import { BaseClient } from './base-client.ts';
import { fetch } from '../utils/index.ts';

import type { GetCalloutWith, Serial, GetCalloutDataWith } from '../types/index.ts';
import type { Paginated } from '@beabee/beabee-common';

export class CalloutClient extends BaseClient {
    async get<With extends GetCalloutWith = void>(slug: string, _with?: readonly With[]) {
        const { data } = await fetch.get<Paginated<Serial<GetCalloutDataWith<With>>>>(
            '/callout/' + slug,
            { params: { with: _with } }
        );
    }
} 
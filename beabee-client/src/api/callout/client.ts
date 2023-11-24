import { BaseClient } from '../client.ts';
import { GetCalloutWith } from '../../types/index.ts';

export class CalloutClient extends BaseClient {
    get<With extends GetCalloutWith = void>(slug: string) {
        // TODO: Implement
    }
}
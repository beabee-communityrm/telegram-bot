import { GetCalloutData } from '@beabee/client';

export interface GetCalloutDataExt extends GetCalloutData {
  url: string | null;
}

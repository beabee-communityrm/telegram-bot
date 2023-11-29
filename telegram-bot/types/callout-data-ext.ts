import { CalloutData } from '@beabee/client';

export interface CalloutDataExt extends CalloutData {
  url: string | null;
}

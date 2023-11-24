import type { PaymentMethod } from '@beabee/beabee-common';
import type { SetContributionData } from './index.ts';

export interface StartContributionData extends SetContributionData {
  paymentMethod: PaymentMethod;
}

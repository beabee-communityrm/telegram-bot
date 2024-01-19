import type { PaymentMethod } from "../deps.ts";
import type { SetContributionData } from "./index.ts";

export interface StartContributionData extends SetContributionData {
  paymentMethod: PaymentMethod;
}

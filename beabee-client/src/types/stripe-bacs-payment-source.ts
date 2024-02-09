import type { PaymentMethod } from "../deps.ts";

export interface StripeBACSPaymentSource {
  method: PaymentMethod.StripeBACS;
  sortCode: string;
  last4: string;
}

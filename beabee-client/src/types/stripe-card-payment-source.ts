import type { PaymentMethod } from "../deps.ts";

export interface StripeCardPaymentSource {
  method: PaymentMethod.StripeCard;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

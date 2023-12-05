import type {
  GoCardlessDirectDebitPaymentSource,
  ManualPaymentSource,
  StripeBACSPaymentSource,
  StripeCardPaymentSource,
  StripeSEPAPaymentSource,
} from "./index.ts";

export type PaymentSource =
  | StripeCardPaymentSource
  | GoCardlessDirectDebitPaymentSource
  | StripeBACSPaymentSource
  | StripeSEPAPaymentSource
  | ManualPaymentSource;

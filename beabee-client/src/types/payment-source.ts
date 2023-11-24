import type {
  StripeCardPaymentSource,
  GoCardlessDirectDebitPaymentSource,
  StripeBACSPaymentSource,
  StripeSEPAPaymentSource,
  ManualPaymentSource,
} from './index.ts';

export type PaymentSource =
  | StripeCardPaymentSource
  | GoCardlessDirectDebitPaymentSource
  | StripeBACSPaymentSource
  | StripeSEPAPaymentSource
  | ManualPaymentSource;

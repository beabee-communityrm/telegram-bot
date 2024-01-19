import type { PaymentMethod } from "../deps.ts";

export interface GoCardlessDirectDebitPaymentSource {
  method: PaymentMethod.GoCardlessDirectDebit;
  bankName: string;
  accountHolderName: string;
  accountNumberEnding: string;
}

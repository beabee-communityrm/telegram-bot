import type { PaymentStatus } from "../deps.ts";

export interface GetPaymentData {
  chargeDate: Date;
  amount: number;
  status: PaymentStatus;
}

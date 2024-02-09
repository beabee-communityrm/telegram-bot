import type { ContributionPeriod } from "../deps.ts";

export interface SetContributionData {
  amount: number;
  payFee: boolean;
  prorate: boolean;
  period: ContributionPeriod;
}

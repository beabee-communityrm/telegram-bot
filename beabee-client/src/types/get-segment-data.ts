import type { RuleGroup } from "../deps.ts";

export interface GetSegmentData {
  id: string;
  name: string;
  ruleGroup: RuleGroup;
  order: number;
}

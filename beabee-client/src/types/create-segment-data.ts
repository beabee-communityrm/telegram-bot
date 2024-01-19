import type { RuleGroup } from "../deps.ts";

export interface CreateSegmentData {
  name: string;
  ruleGroup: RuleGroup;
  order?: number;
}

import type { ContributionPeriod, RoleType } from "../deps.ts";

import type { ContactData } from "./index.ts";

export interface GetContactData extends ContactData {
  id: string;
  joined: Date;
  lastSeen?: Date;
  contributionAmount?: number;
  contributionPeriod?: ContributionPeriod;
  activeRoles: RoleType[];
}

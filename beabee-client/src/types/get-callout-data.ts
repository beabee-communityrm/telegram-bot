import type { ItemStatus } from "@beabee/beabee-common";
import type { CalloutData } from "./index.ts";

export interface GetCalloutData extends CalloutData {
  slug: string;
  status: ItemStatus;
}

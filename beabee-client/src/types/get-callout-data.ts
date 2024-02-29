import type { ItemStatus } from "../deps.ts";
import type { CalloutData } from "./index.ts";

export interface GetCalloutData extends CalloutData {
  slug: string;
  status: ItemStatus;
}

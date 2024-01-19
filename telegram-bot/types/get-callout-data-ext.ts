import { GetCalloutData } from "./index.ts";

export interface GetCalloutDataExt extends GetCalloutData {
  url: string | null;
  shortSlug: string;
}

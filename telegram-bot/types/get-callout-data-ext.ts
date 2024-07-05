import { GetCalloutData } from "../deps/index.ts";

export interface GetCalloutDataExt extends GetCalloutData {
  url: string | null;
}

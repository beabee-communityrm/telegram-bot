import { CalloutData } from "../deps.ts";

export interface CalloutDataExt extends CalloutData {
  url: string | null;
  shortSlug: string;
}

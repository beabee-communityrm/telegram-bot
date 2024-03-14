import { CalloutData } from "../deps/index.ts";

export interface CalloutDataExt extends CalloutData {
  url: string | null;
  shortSlug: string;
}

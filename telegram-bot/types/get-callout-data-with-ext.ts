import type { GetCalloutDataWith, GetCalloutWith } from "../deps/index.ts";
import type { GetCalloutDataExt } from "./get-callout-data-ext.ts";

export type GetCalloutDataWithExt<With extends GetCalloutWith = void> =
  & GetCalloutDataWith<With>
  & GetCalloutDataExt;

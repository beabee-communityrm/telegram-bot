import type {
  CalloutFormData,
  CalloutResponseViewSchema,
  GetCalloutData,
  GetCalloutWith,
  Noop,
} from "./index.ts";

export type GetCalloutDataWith<With extends GetCalloutWith> =
  & GetCalloutData
  & ("responseCount" extends With ? { responseCount: number } : Noop)
  & ("hasAnswered" extends With ? { hasAnswered: boolean } : Noop)
  & ("responseViewSchema" extends With
    ? { responseViewSchema: CalloutResponseViewSchema | null }
    : Noop)
  & ("form" extends With ? CalloutFormData : Noop);

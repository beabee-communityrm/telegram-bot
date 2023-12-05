import type {
  AllowNull,
  CalloutData,
  CalloutFormData,
  CalloutResponseViewSchema,
} from "./index.ts";

export type CreateCalloutData = AllowNull<
  & CalloutData
  & CalloutFormData
  & { responseViewSchema?: CalloutResponseViewSchema | null }
>;

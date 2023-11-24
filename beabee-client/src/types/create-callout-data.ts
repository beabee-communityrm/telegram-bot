import type {
  CalloutData,
  AllowNull,
  CalloutFormData,
  CalloutResponseViewSchema,
} from './index.ts';

export type CreateCalloutData = AllowNull<
  CalloutData &
  CalloutFormData & { responseViewSchema?: CalloutResponseViewSchema | null }
>;

import type { GetCalloutFormSchema } from "../deps.ts";

export interface CalloutFormData {
  formSchema: GetCalloutFormSchema;
  intro: string;
  thanksText: string;
  thanksTitle: string;
  thanksRedirect?: string;
  shareTitle?: string;
  shareDescription?: string;
}

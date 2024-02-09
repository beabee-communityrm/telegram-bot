import type { CalloutFormSchema } from "../deps.ts";

export interface CalloutFormData {
  formSchema: CalloutFormSchema;
  intro: string;
  thanksText: string;
  thanksTitle: string;
  thanksRedirect?: string;
  shareTitle?: string;
  shareDescription?: string;
}

import type { CalloutResponseAnswersNestable } from "../deps.ts";

export interface CreateCalloutResponseData {
  guestName?: string;
  guestEmail?: string;
  answers: CalloutResponseAnswersNestable;
  bucket?: string;
  tags?: string[];
  assigneeId?: string | null;
}

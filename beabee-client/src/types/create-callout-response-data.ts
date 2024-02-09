import type { CalloutResponseAnswersSlide } from "../deps.ts";

export interface CreateCalloutResponseData {
  guestName?: string;
  guestEmail?: string;
  answers: CalloutResponseAnswersSlide;
  bucket?: string;
  tags?: string[];
  assigneeId?: string | null;
}

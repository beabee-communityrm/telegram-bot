import type {
  CalloutResponseAnswerAddress,
  CalloutResponseAnswerFileUpload,
  CalloutResponseAnswersNestable,
} from "../deps.ts";

export interface GetCalloutResponseMapData {
  number: number;
  answers: CalloutResponseAnswersNestable;
  title: string;
  photos: CalloutResponseAnswerFileUpload[];
  address?: CalloutResponseAnswerAddress;
}

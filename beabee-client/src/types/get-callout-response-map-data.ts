import type {
  CalloutResponseAnswerAddress,
  CalloutResponseAnswerFileUpload,
  CalloutResponseAnswers,
} from "../deps.ts";

export interface GetCalloutResponseMapData {
  number: number;
  answers: CalloutResponseAnswers;
  title: string;
  photos: CalloutResponseAnswerFileUpload[];
  address?: CalloutResponseAnswerAddress;
}

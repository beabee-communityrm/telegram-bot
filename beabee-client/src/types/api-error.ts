export interface ApiError<Code extends string> {
  httpCode: number;
  name?: string;
  code: Code;
  message?: string;
}

export interface ApiErrorData {
  code?: string;
  errors?: {
    [key: string]: unknown;
  };
  httpCode?: number;
}

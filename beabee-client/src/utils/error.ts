import type { ApiErrorData } from "../types/index.ts";

export class ApiError extends Error implements ApiErrorData {
  code?: string;
  errors?: {
    [key: string]: unknown;
  };
  httpCode?: number;

  constructor(message: string, data: ApiErrorData = {}) {
    super(message);
    this.code = data.code;
    this.errors = data.errors;
    this.httpCode = data.httpCode;
  }
}

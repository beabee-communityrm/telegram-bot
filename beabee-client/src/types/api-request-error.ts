import type { FetchResponse, ApiError } from './index.ts';

export type ApiRequestError<
    Code extends string = string,
    Status extends number = number,
> = FetchResponse<ApiError<Code>> & {
    status: Status;
};

export { }
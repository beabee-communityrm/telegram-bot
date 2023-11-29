import type { ApiRequestError, ApiError } from '../types/index.ts';

// TODO: Test me
export function isRequestError<Code extends string>(
    err: unknown,
    codes?: Code[]
): err is ApiRequestError<Code, 400>;
export function isRequestError<Code extends string, Status extends number>(
    err: unknown,
    codes: Code[] | undefined,
    status: Status[]
): err is ApiRequestError<Code, Status>;
export function isRequestError<Code extends string, Status extends number>(
    err: unknown,
    codes: string[] = [],
    status: Status[] = [400] as Status[]
): err is ApiRequestError<Code, Status> {
    const error = err as Partial<ApiRequestError<Code, Status>>;
    if (
        typeof error.status === 'number' &&
        status.includes(error.status as Status)
    ) {
        const data = error.data as ApiError<Code>;
        return !codes.length || codes.includes(data.code);
    }

    return false;
}
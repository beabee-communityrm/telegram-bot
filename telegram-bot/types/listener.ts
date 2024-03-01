// deno-lint-ignore no-explicit-any
export type Listener<T = any> = ((data: T) => void) & { once?: boolean };

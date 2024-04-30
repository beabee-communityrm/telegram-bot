/**
 * Check whether variable is number or a string with numbers in JavaScript
 */
export const isNumber = (
  value?: string | number | undefined | null,
): boolean => {
  if (value === undefined || value === null) {
    return false;
  }

  // deno-lint-ignore no-explicit-any
  return !isNaN(parseFloat(value as any)) && !isNaN((value as any) - 0);
};

/**
 * Just get the numbers of a string
 */
export const extractNumbers = (str: string | number | undefined) => {
  if (str === undefined) {
    return NaN;
  }
  if (typeof str === "number") {
    return str;
  }
  const num = str.replace(/[^-\d.]/g, "");
  if (!isNumber(num)) {
    return NaN;
  } else {
    return Number(num);
  }
};

/**
 * Generates a number range from `start` to `end` with `step` size
 */
export const range = (start: number, end: number, step = 1) => {
  const length = Math.floor((end - start) / step) + 1;
  return Array.from({ length }, (_, i) => start + i * step);
};

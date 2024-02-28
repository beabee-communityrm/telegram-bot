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
export const extractNumbers = (str: string | number) => {
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

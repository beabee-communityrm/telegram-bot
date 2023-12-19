/**
 * Check whether variable is number or a string with numbers in JavaScript
 */
// deno-lint-ignore no-explicit-any
export const isNumber = (value?: any): boolean => {
  return !isNaN(parseFloat(value)) && !isNaN(value - 0);
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
    return 0;
  } else {
    return Number(num);
  }
};

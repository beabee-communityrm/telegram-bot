/**
 * Converts all properties of a given type `T` to be nullable.
 *
 * This mapped type iterates over each property (`P`) in the type `T`.
 * For each property, it creates a union type of the original property type (`T[P]`)
 * and `null`, effectively making all properties nullable.
 *
 * @typeParam T - The original type with properties that are to be made nullable.
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   email?: string;
 * }
 *
 * // Converted type where all properties are nullable
 * type NullableUser = NullableProperties<User>;
 *
 * const user: NullableUser = {
 *   id: null,
 *   name: null,
 *   email: null // This property was optional in the original type, but is now explicitly nullable
 * };
 */
export type NullableProperties<T> = {
  [P in keyof T]: T[P] | null;
};

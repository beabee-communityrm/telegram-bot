/** Create a new type which needs to have all properties from another type / interface */
export type PropsFrom<Props, Type> = {
  [P in keyof Props]: Type;
};

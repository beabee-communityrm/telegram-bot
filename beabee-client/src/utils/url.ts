export const cleanUrl = (url: string): string => {
  return url.replaceAll("//", "/");
};

export function objToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        params.append(key, item);
      });
    } else if (typeof value === "object" && value !== null) {
      params.append(key, JSON.stringify(value));
    } else {
      if (value !== undefined) {
        params.append(key, value);
      }
    }
  });

  return params.toString();
}

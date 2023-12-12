export const cleanUrl = (url: string): string => {
  return url.replaceAll("//", "/");
};

export const getFilenameFromUrl = (url: string | URL) => {
  if (typeof url === "string") {
    url = new URL(url);
  }
  const pathname = url.pathname;
  const filename = pathname.split("/").pop();
  return filename;
};

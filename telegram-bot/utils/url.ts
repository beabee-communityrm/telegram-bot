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

export const waitForUrl = async (url: string): Promise<void> => {
  while (true) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (_error) {
      // The request has failed, which means that the URL is not yet available.
      // We'll wait a second before trying again.
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
/**
 * Clean a URL by removing duplicate slashes.
 * @param url The URL to clean.
 * @returns The cleaned URL.
 */
export const cleanUrl = (url: string): string => {
  return url.replaceAll("//", "/");
};

/**
 * Get the filename from a URL.
 * @param url The URL to get the filename from.
 * @returns The filename.
 */
export const getFilenameFromUrl = (url: string | URL) => {
  if (typeof url === "string") {
    url = new URL(url);
  }
  const pathname = url.pathname;
  const filename = pathname.split("/").pop();
  return filename;
};

/**
 * Wait for a URL to become available.
 * @param url The URL to wait for.
 * @returns A promise that resolves when the URL is available.
 */
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

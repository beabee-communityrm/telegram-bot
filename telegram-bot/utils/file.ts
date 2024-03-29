import { getFilenameFromUrl } from "./index.ts";
import { mediaTypes, parseJsonc } from "../deps/index.ts";

export const mimeTypeNames = Object.keys(mediaTypes.db);

/**
 * Download an image from a url and return the path to the downloaded image.
 * @param url The url of the image to download.
 * @param path The path to download the image to, or undefined to download to a temporary directory.
 * @returns The path to the downloaded image.
 */
export const downloadImage = async (url: string | URL, path?: string) => {
  if (typeof url === "string") {
    url = new URL(url);
  }
  if (!path) {
    const filename = getFilenameFromUrl(url);
    path = await Deno.makeTempDir();
    path = `${path}/${filename}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `There was an error downloading the image: ${response.statusText}`,
    );
  }

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();

  await Deno.writeFile(path, new Uint8Array(buffer));

  return path;
};

/**
 * Filters MIME types based on a file pattern.
 * Supports both wildcard patterns (e.g., "image/*") and specific MIME types (e.g., "image/gif").
 *
 * @param pattern The file pattern, e.g., "image/*" or "image/gif".
 * @returns Filtered array of MIME types that match the pattern.
 */
export const filterMimeTypesByPattern = (
  pattern: string,
): string[] => {
  if (pattern === "*" || pattern === "*/*") {
    return []; // Allow any MIME type
  }
  // Check for wildcard pattern
  if (pattern.endsWith("/*")) {
    // Extract the main type from the pattern (e.g., "image" from "image/*")
    const type = pattern.split("/")[0];

    // Filter MIME types that start with the main type
    return mimeTypeNames.filter((mimeType) => mimeType.startsWith(`${type}/`));
  } else {
    // Filter MIME types that exactly match the pattern
    return mimeTypeNames.filter((mimeType) => mimeType === pattern);
  }
};

/**
 * Transform a [file pattern](https://github.com/danialfarid/ng-file-upload) to a mime types
 * @param filePattern
 * @returns
 */
export const filterMimeTypesByPatterns = (filePattern: string) => {
  const mimeTypes: string[] = [];
  if (!filePattern) {
    return mimeTypes;
  }
  const filePatterns = filePattern.split(",");
  for (let filePattern of filePatterns) {
    filePattern = filePattern.trim();
    if (!filePattern) {
      continue;
    }
    mimeTypes.push(...filterMimeTypesByPattern(filePattern));
  }

  console.debug("filePatternToMimeType", filePattern, mimeTypes);

  return mimeTypes;
};

/**
 * Get the simple mime type from a mime type.
 * E.g. "image/gif" => "image"
 * @param mimeType
 * @returns
 */
export const getSimpleMimeType = (mimeType: string) => {
  return mimeType.split("/")[0];
};

/**
 * Get the simple mime types from a list of mime types.
 * E.g. ["image/gif", "image/png"] => ["image"]
 * E.g. ["image/gif", "video/mp4"] => ["image", "video"]
 * @param mimeTypes
 * @returns
 */
export const getSimpleMimeTypes = (mimeTypes: string[]) => {
  const map: { [key: string]: true } = {};
  for (const mimeType of mimeTypes) {
    map[getSimpleMimeType(mimeType)] = true;
  }
  return Object.keys(map);
};

/**
 * Read a json file
 * @param path The path to the json file
 * @returns The json data
 */
export const readJson = async (path: string) => {
  const fileContent = await Deno.readTextFile(path);
  return parseJsonc(fileContent);
};

/**
 * Read a json file synchronously
 * @param path The path to the json file
 * @returns The json data
 */
export const readJsonSync = (path: string) => {
  const fileContent = Deno.readTextFileSync(path);
  return parseJsonc(fileContent);
};

export interface ReplayWaitForFile {
  type: "file";
  /**
   * Define a file mime type to wait this specific mime type or leave it undefined to wait for any file type
   */
  mimeTypes?: string[];
}

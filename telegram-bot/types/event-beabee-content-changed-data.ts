import type { Content, ContentId } from "../types/index.ts";

export interface EventBeabeeContentChangedData<T extends ContentId> {
  newContent: Content<T>;
  oldContent: Content<T>;
}

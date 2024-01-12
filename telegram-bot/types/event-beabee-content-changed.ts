import type {
  ContentId,
  EventBeabeeContentChangedData,
} from "../types/index.ts";

export type EventBeabeeContent<T extends ContentId> = CustomEvent<
  EventBeabeeContentChangedData<T>
>;

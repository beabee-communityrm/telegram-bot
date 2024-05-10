import type { ContentGeneralData, ContentTelegramData } from "../deps/index.ts";

export interface StateSettings {
  general: ContentGeneralData;
  telegram: ContentTelegramData;
}

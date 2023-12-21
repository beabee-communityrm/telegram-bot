export {
  Ammonia,
  AmmoniaBuilder,
  clean as ammoniaClean,
  cleanText as ammoniaCleanText,
  init as ammoniaInit,
} from "https://deno.land/x/ammonia@0.3.1/mod.ts";

import { db as mediaTypeDb } from "https://deno.land/std@0.208.0/media_types/_db.ts";
import * as _mediaTypes from "https://deno.land/std@0.208.0/media_types/mod.ts";
export const mediaTypes = { ..._mediaTypes, db: mediaTypeDb };

// TODO: Move more dependencies here

import { db as mediaTypeDb } from "https://deno.land/std@0.208.0/media_types/_db.ts";
import * as _mediaTypes from "https://deno.land/std@0.208.0/media_types/mod.ts";
export const mediaTypes = { ..._mediaTypes, db: mediaTypeDb };

export {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.222.1/path/mod.ts";

export { equal } from "https://deno.land/std@0.222.1/assert/mod.ts";

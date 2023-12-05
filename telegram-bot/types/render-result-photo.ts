import { RenderResultType } from "../enums/index.ts";
import type { InputMediaPhoto } from "grammy/types.deno.ts";
import type { RenderResultBase } from "./index.ts";

export interface RenderResultPhoto extends RenderResultBase {
  type: RenderResultType.PHOTO;
  photo: InputMediaPhoto;
}

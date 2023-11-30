import { RenderResultType } from "../enums/index.ts";
import type { InputMediaPhoto } from "grammy/types.deno.ts";

export interface RenderResultPhoto {
    type: RenderResultType.PHOTO;
    photo: InputMediaPhoto;
}
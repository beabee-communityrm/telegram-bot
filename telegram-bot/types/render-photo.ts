import { RenderType } from "../enums/index.ts";
import type { InputMediaPhoto } from "../deps/index.ts";
import type { RenderBase } from "./index.ts";

export interface RenderPhoto extends RenderBase {
  type: RenderType.PHOTO;
  photo: InputMediaPhoto;
}

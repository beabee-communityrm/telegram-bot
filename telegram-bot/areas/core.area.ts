import { Area } from "../deps/index.ts";
import * as Controllers from "../controllers/index.ts";

// Declare module
@Area({
  controllers: [...Object.values(Controllers)],
})
export class CoreArea {
}

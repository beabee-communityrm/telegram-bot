import { Area } from "alosaur";
import { CoreController } from "../controllers/core.controller.ts";

// Declare module
@Area({  controllers: [CoreController],})
export class CoreArea {}
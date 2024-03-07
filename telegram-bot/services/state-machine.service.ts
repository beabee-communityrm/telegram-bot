import { BaseService } from "../core/index.ts";
import { ContentClient, Singleton } from "../deps.ts";

import type { Content, ContentId } from "../types/index.ts";

@Singleton()
export class StateMachineService extends BaseService {
  constructor() {
    super();
  }
}

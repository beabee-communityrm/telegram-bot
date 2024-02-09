import { Singleton } from "../deps.ts";

import { ConditionService } from "./condition.service.ts";

/**
 * Define and check `CalloutComponentSchema` conditions for a replay.
 * This class checks replays messages for `CalloutComponentSchema` conditions.
 * TODO: Currently not implemented.
 */
@Singleton()
export class CalloutConditionService extends ConditionService {
  constructor() {
    super();
    console.debug(`${this.constructor.name} created`);
  }
}

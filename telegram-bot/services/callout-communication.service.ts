import { Singleton } from "../deps.ts";
import { EventService } from "./event.service.ts";
import { TransformService } from "./transform.service.ts";
import { CalloutConditionService } from "./callout-condition.service.ts";
import { CommunicationService } from "./communication.service.ts";
import { MessageRenderer } from "../renderer/message.renderer.ts";

/**
 * Service to handle the callout replay communication with the telegram bot and the telegram user.
 * This service waits for a response until a response is received that fulfils a CalloutComponentSchema condition.
 * TODO: Currently not implemented.
 */
@Singleton()
export class CalloutCommunicationService extends CommunicationService {
  constructor(
    protected readonly event: EventService,
    protected readonly messageRenderer: MessageRenderer,
    protected readonly transform: TransformService,
    protected readonly condition: CalloutConditionService,
  ) {
    super(event, messageRenderer, transform, condition);
    console.debug(`${this.constructor.name} created`);
  }
}

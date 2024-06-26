import { Singleton } from "../deps/index.ts";
import { EventService } from "../services/event.service.ts";
import { CommandService } from "../services/command.service.ts";
import { BaseEventManager } from "../core/base.events.ts";
import { StateMachineEvent } from "../enums/index.ts";

import type { EventTelegramBot } from "../types/index.ts";

@Singleton()
export class SessionEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly command: CommandService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    this.event.on(
      StateMachineEvent.SESSION_CHANGED,
      (event) => this.onSessionChanged(event),
    );
  }

  protected async onSessionChanged(data: EventTelegramBot) {
    await this.command.onSessionChanged(data);
  }
}

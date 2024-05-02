import { Singleton } from "../deps/index.ts";
import { EventService } from "../services/event.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { StateMachineService } from "../services/state-machine.service.ts";
import { BaseEventManager } from "../core/base.events.ts";
import { NetworkCommunicatorEvents } from "../enums/index.ts";

import type { EventNetworkCommunicatorReloadData } from "../types/index.ts";

@Singleton()
export class NetworkCommunicatorEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly i18n: I18nService,
    protected readonly stateMachine: StateMachineService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    this.event.on<EventNetworkCommunicatorReloadData>(
      NetworkCommunicatorEvents.RELOAD,
      (data) => this.onReload(data),
    );
  }

  protected async onReload(
    data: EventNetworkCommunicatorReloadData,
  ) {
    console.debug("On reload event: ", data);
    this.stateMachine.settings.general = data.general;
    this.stateMachine.settings.telegram = data.telegram;

    // If the locale changed, update the active language
    await this.i18n.setActiveLang(data.general.locale);
  }
}

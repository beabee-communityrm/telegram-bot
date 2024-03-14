import { Singleton } from "../deps/index.ts";
import { EventService } from "../services/event.service.ts";
import { AppService } from "../services/app.service.ts";
import { BaseEventManager } from "../core/base.events.ts";
import { I18nEvent } from "../enums/i18n-event.ts";

import type { EventTelegramBot } from "../types/index.ts";

@Singleton()
export class I18nEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly AppService: AppService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    this.event.on<string>(
      I18nEvent.LANGUAGE_CHANGED,
      (event) => this.onLanguageChanged(event),
    );
  }

  protected onLanguageChanged(data: EventTelegramBot<string>) {
    console.debug("Language changed to: ", data);
    this.AppService.changeLocale(data);
  }
}

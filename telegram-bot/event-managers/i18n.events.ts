import { Singleton } from "alosaur/mod.ts";
import { EventService } from "../services/event.service.ts";
import { TelegramService } from "../services/telegram.service.ts";
import { EventManager } from "../core/event-manager.ts";
import { I18nEvent } from "../enums/i18n-event.ts";

import type { EventTelegramBot } from "../types/index.ts";

@Singleton()
export class I18nEventManager extends EventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly telegramService: TelegramService,
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

  protected onLanguageChanged(event: EventTelegramBot<string>) {
    console.debug("Language changed to: ", event.detail);
    this.telegramService.changeLocale(event.detail);
  }
}

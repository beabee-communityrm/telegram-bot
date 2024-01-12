import { Singleton } from "alosaur/mod.ts";
import { EventService } from "../services/event.service.ts";
import { TelegramService } from "../services/telegram.service.ts";
import { EventManager } from "../core/event-manager.ts";
import { I18nEvent } from "../enums/i18n-event.ts";

import type { TelegramBotEvent } from "../types/index.ts";

@Singleton()
export class I18nEventManager extends EventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly telegramService: TelegramService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Forward Telegram bot events to the EventService
   */
  public init() {
    this.event.on<string>(
      I18nEvent.LanguageChanged,
      (event) => this.onLanguageChanged(event),
    );
  }

  protected onLanguageChanged(event: TelegramBotEvent<string>) {
    console.debug("Language changed to: ", event.detail);
    this.telegramService.changeLanguage(event.detail);
  }
}

import { Singleton } from "alosaur/mod.ts";
import { EventService } from "../services/event.service.ts";
import { TelegramService } from "../services/telegram.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { EventManager } from "../core/event-manager.ts";
import { BeabeeContentEventName } from "../enums/index.ts";

import type {
  EventBeabeeContent,
  EventBeabeeContentChangedData,
} from "../types/index.ts";

@Singleton()
export class BeabeeContentEventNameManager extends EventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly telegramService: TelegramService,
    protected readonly i18n: I18nService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    this.event.on<EventBeabeeContentChangedData<"general">>(
      BeabeeContentEventName.GENERAL_CHANGED,
      (event) => this.onContentGeneralChanged(event),
    );
  }

  protected async onContentGeneralChanged(
    event: EventBeabeeContent<"general">,
  ) {
    console.debug("General content changed: ", event.detail);
    // If the locale changed, update the active language
    await this.i18n.setActiveLang(event.detail.newContent.locale);

    // TODO: Also process the other properties from the beabee content like `organisationName`, `logoUrl`. `siteUrl`, etc.
  }
}

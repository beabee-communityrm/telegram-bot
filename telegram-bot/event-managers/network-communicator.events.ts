import { Singleton } from "alosaur/mod.ts";
import { EventService } from "../services/event.service.ts";
import { BeabeeContentService } from "../services/beabee-content.service.ts";
import { I18nService } from "../services/i18n.service.ts";
import { BaseEventManager } from "../core/base.events.ts";
import { NetworkCommunicatorEvents } from "../enums/index.ts";

@Singleton()
export class NetworkCommunicatorEventManager extends BaseEventManager {
  constructor(
    protected readonly event: EventService,
    protected readonly beabeeContent: BeabeeContentService,
    protected readonly i18n: I18nService,
  ) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  public init() {
    this.event.on<unknown>(
      NetworkCommunicatorEvents.RELOAD,
      (data) => this.onReload(data),
    );
  }

  protected async onReload(
    _: unknown,
  ) {
    const beabeeGeneralContent = await this.beabeeContent.get("general");

    console.debug("On reload event: ", beabeeGeneralContent);

    // If the locale changed, update the active language
    await this.i18n.setActiveLang(beabeeGeneralContent.locale);
  }
}

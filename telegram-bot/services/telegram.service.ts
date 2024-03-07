import { BaseService } from "../core/index.ts";
import { container, Singleton } from "../deps.ts";
import { I18nService } from "./i18n.service.ts";
import { BotService } from "./bot.service.ts";
import { CommandService } from "./command.service.ts";
import { NetworkCommunicatorService } from "./network-communicator.service.ts";
import { BeabeeContentService } from "./beabee-content.service.ts";
import { readJson, waitForUrl } from "../utils/index.ts";

import type { EventManagerClass } from "../types/index.ts";

/**
 * TelegramService is a Singleton service that handles the Telegram bot.
 * - Initialize the bot
 * - Add commands
 * - Add event listeners using the EventManagers
 */
@Singleton()
export class TelegramService extends BaseService {
  constructor(
    protected readonly command: CommandService,
    protected readonly bot: BotService,
    protected readonly i18n: I18nService,
    protected readonly beabeeContent: BeabeeContentService,
    protected readonly networkCommunicator: NetworkCommunicatorService,
  ) {
    super();
    // this.bootstrap().catch(console.error);
    console.debug(`${this.constructor.name} created`);
  }

  public async changeLocale(lang: string) {
    await this.command.onLocaleChange(lang);
  }

  /**
   * Bootstrap the bot asynchronously:
   * - Initialize the localization
   * - Add commands
   * - Add event listeners
   * - Start the bot
   */
  public async bootstrap() {
    await this.printInfo();
    await this.waitForBeabee();
    this.networkCommunicator.startServer();
    await this.command.initCommands();
    await this.initEventManagers();

    // Start the bot
    this.bot.start();
  }

  protected async waitForBeabee() {
    console.debug("Waiting for Beabee...");
    const api = Deno.env.get("API_PROXY_URL")!;
    await waitForUrl(api);
    console.debug("Beabee is ready");
    return;
  }

  protected async printInfo() {
    const pkg = await readJson("./deno.json");
    console.info(`\n${pkg.name} v${pkg.version}`);

    const me = await this.bot.api.getMe();
    console.info(`\nBot will start as "${me.username}"`);
  }

  protected async initBeabeeContent() {
    const beabeeGeneralContent = await this.beabeeContent.get("general");
    console.debug("beabeeGeneralContent", beabeeGeneralContent);

    // Initialize the localization
    await this.i18n.setActiveLang(beabeeGeneralContent.locale);

    return beabeeGeneralContent;
  }

  protected async initEventManagers() {
    const EventMangers = await import("../event-managers/index.ts");
    for (const EventManager of Object.values(EventMangers)) {
      // TODO: Fix type
      const eventManager = (EventManager as EventManagerClass).getSingleton(); // Get the Singleton instance
      eventManager.init();
    }
  }
}

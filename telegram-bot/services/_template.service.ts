import { BaseService } from "../core/index.ts";
import { Singleton } from "../deps/index.ts";
import { BotService } from "./bot.service.ts";

/**
 * A template for new services, just copy and paste this file and rename it.
 * Replace the BotService with the service(s) you need.
 */
@Singleton()
export class TemplateService extends BaseService {
  constructor(protected readonly bot: BotService) {
    super();
  }
}

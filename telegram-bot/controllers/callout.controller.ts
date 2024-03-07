import { Controller, Get } from "alosaur/mod.ts";
import { SubscriberService } from "../services/subscriber.service.ts";
import { BotService } from "../services/bot.service.ts";

/**
 * Example controller that can be used in the browser creating GET requests for testing
 */
@Controller("/callout")
export class CalloutController {
  constructor(
    private readonly subscriber: SubscriberService,
    private readonly bot: BotService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Just to test sending a message to all subscribers.
   * Can be removed.
   */
  @Get("/hello-world")
  async helloWorld() {
    const all = await this.subscriber.all();
    if (all.length === 0) return "No subscribers yet!";
    console.debug("Sending hello world message to all subscribers");
    all.forEach((subscriber) =>
      this.bot.api.sendMessage(subscriber.id, "Hello world")
    );
    return "Hello world message to all subscribers sent!";
  }

  /**
   * Just to test retrieving all subscribers.
   * Can be removed.
   */
  @Get("/subscribers")
  subscribers() {
    return this.subscriber.all();
  }
}

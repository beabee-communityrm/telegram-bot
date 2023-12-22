import { Controller, Get } from "alosaur/mod.ts";
import { SubscriberService, TelegramService } from "../services/index.ts";

@Controller()
export class CoreController {
  constructor(
    private readonly subscriber: SubscriberService,
    private readonly telegram: TelegramService,
  ) {}

  /**
   * Alive endpoint
   * @returns Alive message
   */
  @Get("/")
  alive() {
    return "Application is running";
  }

  /**
   * Health check endpoint
   * @returns Health check message
   */
  @Get("/health")
  healthCheck() {
    return "Application is healthy";
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
      this.telegram.bot.api.sendMessage(subscriber.id, "Hello world")
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

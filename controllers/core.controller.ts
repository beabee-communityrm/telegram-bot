import { Controller, Get } from "alosaur";
import { SubscriberService, TelegramService } from '../services/index.ts';

@Controller()
export class CoreController {

  constructor(private readonly subscriber: SubscriberService, private readonly telegram: TelegramService) {}

  @Get()
  async helloWorld() {
    const all = await this.subscriber.all();
    if(all.length === 0) return "No subscribers yet!";
    console.debug("Sending hello world message to all subscribers", all);
    // all.forEach((subscriber) => this.telegram.bot.api.sendMessage(subscriber.id, "Hello world"));
    return "Hello world message to all subscribers sent!";
  }

  @Get("/subscribers")
  subscribers() {
    return this.subscriber.all();
  }
}

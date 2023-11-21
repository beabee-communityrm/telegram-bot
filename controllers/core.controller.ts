import { Area, Controller, Get } from "alosaur";
import { SubscriberService, TelegramService } from '../services/index.ts';

@Controller()
export class CoreController {

  constructor(private readonly subscriber: SubscriberService, private readonly telegram: TelegramService) {}

  @Get()
  helloWorld() {
    if(this.subscriber.all.length === 0) return "No subscribers yet!";
    this.subscriber.all.forEach((subscriber) => this.telegram.bot.api.sendMessage(subscriber.id, "Hello world"));
    return "Hello world message to all subscribers sent!";
  }

  @Get("/subscribers")
  subscribers() {
    return this.subscriber.all
  }
}

@Area({
  controllers: [CoreController],
})
export class CoreArea {}

import { Area, Controller, Get } from "alosaur";
import { TelegramService } from '../services/telegram.service.ts';

@Controller()
export class CoreController {

  constructor(private telegram: TelegramService) {}

  @Get()
  helloWorld() {
    this.telegram.subscriptions.forEach((id) => this.telegram.bot.api.sendMessage(id, "Hello world"));
    return "Hello world message to all subscribers sent!";
  }

  @Get("/subscribers")
  subscribers() {
    return this.telegram.subscriptions
  }
}

@Area({
  controllers: [CoreController],
})
export class CoreArea {}

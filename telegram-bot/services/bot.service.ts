import {
  Bot as BotService,
  container,
  Context,
  hydrateReply,
  ParseModeFlavor,
} from "../deps.ts";
import { load } from "std/dotenv/mod.ts";

await load({ export: true });
const token = Deno.env.get("TELEGRAM_TOKEN");
if (!token) throw new Error("TELEGRAM_TOKEN is not set");

const bot = new BotService<ParseModeFlavor<Context>>(token);

// Install Grammy plugins
bot.use(hydrateReply);

// Register the bot instance for dependency injection
container.registerInstance(BotService<ParseModeFlavor<Context>>, bot);

export { BotService };

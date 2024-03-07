import { load } from "std/dotenv/mod.ts";
import { App } from "alosaur/mod.ts";
import { CoreArea } from "./areas/core.area.ts";
import { TelegramService } from "./services/telegram.service.ts";

await load({ export: true });

const port = Deno.env.get("TELEGRAM_BOT_PORT") || "3003";
const host = Deno.env.get("TELEGRAM_BOT_HOST") || "localhost";

const app = new App({
  areas: [CoreArea],
  logging: false,
});

const telegramService = TelegramService.getSingleton();
await telegramService.bootstrap();

const address = `${host}:${port}`;
console.debug(`Listening on ${address}`);

app.listen(address);

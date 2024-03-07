import { load } from "std/dotenv/mod.ts";
import { App } from "alosaur/mod.ts";
import { CoreArea } from "./areas/core.area.ts";
import { AppService } from "./services/app.service.ts";

await load({ export: true });

const port = Deno.env.get("TELEGRAM_BOT_PORT") || "3003";
const host = Deno.env.get("TELEGRAM_BOT_HOST") || "localhost";

const app = new App({
  areas: [CoreArea],
  logging: false,
});

const appService = AppService.getSingleton();
await appService.bootstrap();

const address = `${host}:${port}`;
console.debug(`Listening on ${address}`);

app.listen(address);

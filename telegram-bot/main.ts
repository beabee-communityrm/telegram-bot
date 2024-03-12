import { App, dotenv } from "./deps/index.ts";
import { CoreArea } from "./areas/core.area.ts";
import { AppService } from "./services/app.service.ts";

await dotenv.load({ export: true });

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

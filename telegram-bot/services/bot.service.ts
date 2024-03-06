import { Bot as BotService, container } from "../deps.ts";
import { load } from "std/dotenv/mod.ts";

await load({ export: true });
const token = Deno.env.get("TELEGRAM_TOKEN");
if (!token) throw new Error("TELEGRAM_TOKEN is not set");
const bot = new BotService(token);
container.registerInstance(BotService, bot);

export { BotService };

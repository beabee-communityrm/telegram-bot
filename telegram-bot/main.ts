import { load } from "std/dotenv/mod.ts";
import { App } from "alosaur/mod.ts";
import { CoreArea } from "./areas/core.area.ts";

await load({ export: true });

const app = new App({
  areas: [CoreArea],
  logging: false,
});

app.listen();

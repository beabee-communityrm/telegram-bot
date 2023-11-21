import { load } from "dotenv"
import { App } from "alosaur";
import { CoreArea } from './areas/core.area.ts'

await load({ export: true});

const app = new App({
  areas: [CoreArea],
  logging: false,
});

app.listen();

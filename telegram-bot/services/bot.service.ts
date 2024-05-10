import {
  Bot,
  hydrateReply,
  lazySession,
  NextFunction,
  Singleton,
} from "../deps/index.ts";

import { StateMachineService } from "./state-machine.service.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class BotService extends Bot<AppContext> {
  constructor(
    protected readonly stateMachine: StateMachineService,
  ) {
    const token = Deno.env.get("TELEGRAM_TOKEN");
    if (!token) throw new Error("TELEGRAM_TOKEN is not set");
    super(token);

    // See https://grammy.dev/plugins/session
    this.use(lazySession({
      initial: this.stateMachine.createSessionProxy.bind(this.stateMachine),
    }));

    // See https://grammy.dev/plugins/parse-mode
    this.use(hydrateReply);

    // Custom middleware, see https://grammy.dev/guide/middleware#writing-custom-middleware
    this.use(async (ctx: AppContext, next: NextFunction) => {
      const session = await ctx.session;
      session._data.ctx = ctx;
      await next();
    });
  }
}

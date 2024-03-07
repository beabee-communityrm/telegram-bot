import { Bot, hydrateReply, session, Singleton } from "../deps.ts";

import { StateMachineService } from "./state-machine.service.ts";

import type { AppContext } from "../types/index.ts";

@Singleton()
export class BotService extends Bot<AppContext> {
  constructor(protected readonly stateMachine: StateMachineService) {
    const token = Deno.env.get("TELEGRAM_TOKEN");
    if (!token) throw new Error("TELEGRAM_TOKEN is not set");
    super(token);

    // See https://grammy.dev/plugins/session
    // TODO: Implement a custom [session storage](https://grammy.dev/plugins/session#storing-your-data) which uses the snapshot method of the state machine
    this.use(session({ initial: this.newSession.bind(this) }));

    // See https://grammy.dev/plugins/parse-mode
    this.use(hydrateReply);
  }

  newSession() {
    const session = this.stateMachine.create({
      state: "initial",
    });
    return session;
  }
}

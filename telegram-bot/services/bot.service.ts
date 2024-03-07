import { Bot, hydrateReply, session, Singleton } from "../deps.ts";

import { StateMachineService } from "./state-machine.service.ts";

import type { AppContext, SessionState } from "../types/index.ts";

@Singleton()
export class BotService extends Bot<AppContext> {
  constructor(
    protected readonly stateMachine: StateMachineService,
  ) {
    const token = Deno.env.get("TELEGRAM_TOKEN");
    if (!token) throw new Error("TELEGRAM_TOKEN is not set");
    super(token);

    // See https://grammy.dev/plugins/session
    this.use(session({
      initial: this.newSession.bind(this),
    }));

    // See https://grammy.dev/plugins/parse-mode
    this.use(hydrateReply);
  }

  newSession() {
    const session = this.stateMachine.create<SessionState>({
      state: "initial",
    });

    // Just for testing
    this.stateMachine.subscribe(session, (snapshot) => {
      console.debug("Session updated", snapshot);
    });

    return session;
  }
}

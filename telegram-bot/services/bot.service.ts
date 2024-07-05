import { Bot, hydrateReply, lazySession, Singleton } from "../deps/index.ts";

import { KeyValueStorageAdapter } from "../adapters/key-value-storage-adapter.ts";

import { StateMachineService } from "./state-machine.service.ts";
import { getSessionKey } from "../utils/index.ts";

import type { AppContext } from "../types/index.ts";

/**
 * key-value store
 * @see https://docs.deno.com/examples/kv/
 * @see https://github.com/grammyjs/storages/tree/main/packages/denokv
 */
const kv = await Deno.openKv("./data/kv.db");

@Singleton()
export class BotService extends Bot<AppContext> {
  kv: Deno.Kv;

  constructor(
    protected readonly stateMachine: StateMachineService,
  ) {
    const token = Deno.env.get("TELEGRAM_TOKEN");
    if (!token) throw new Error("TELEGRAM_TOKEN is not set");
    super(token);

    this.kv = kv;

    // See https://grammy.dev/plugins/session
    this.use(lazySession({
      initial: this.stateMachine.getInitialSession.bind(this.stateMachine),
      // deno-lint-ignore no-explicit-any
      getSessionKey: getSessionKey as any, // TODO: Fix type
      storage: new KeyValueStorageAdapter(this.kv),
    }));

    // See https://grammy.dev/plugins/parse-mode
    this.use(hydrateReply);
  }
}

import { BaseService } from "../core/index.ts";
import {
  proxy,
  ref,
  Singleton,
  snapshot,
  subscribe,
  watch,
} from "../deps/index.ts";
import { EventService } from "./event.service.ts";
import { KeyboardService } from "./keyboard.service.ts";
import { ChatState, SessionEvent } from "../enums/index.ts";

import type { SessionState } from "../types/index.ts";

/**
 * State machine service
 * * More or less just a injectable wrapper for [valtio](https://github.com/pmndrs/valtio) (vanillla-version)
 * * Can be enriched with its own functionalities if needed
 * * Used to create a proxy state object using {@link StateMachineService.create} for each chat session (sessions are handled using [Grammy's session plugin](https://grammy.dev/plugins/session))
 * * Changes on the state (or any sub property) can be subscribed using {@link StateMachineService.subscribe}.
 */
@Singleton()
export class StateMachineService extends BaseService {
  constructor(
    protected readonly event: EventService,
    protected readonly keyboard: KeyboardService,
  ) {
    super();
  }

  /**
   * Create a new proxy state object.
   * The [proxy](https://valtio.pmnd.rs/docs/api/basic/proxy) tracks changes to the original object and all nested objects, notifying listeners when an object is modified.
   * @param baseObject
   * @returns
   */
  public create<T extends object>(baseObject?: T): T {
    return proxy(baseObject);
  }

  /**
   * Create a new session state object for a chat session handled by Grammy's session plugin.
   * @returns
   */
  public createSession() {
    const sessionProxy = this.create<SessionState>({
      state: ChatState.Initial,
      _data: this.ref({
        ctx: null,
        abortController: null,
      }),
    });

    // Auto-subscribe to session changes and forward them as events
    this.subscribe(sessionProxy, (_ops) => {
      console.debug("Session updated", sessionProxy.state, _ops);
      const ctx = sessionProxy._data.ctx;
      if (!ctx) return;
      this.event.emit(SessionEvent.SESSION_CHANGED, ctx);
    });

    return sessionProxy;
  }

  /**
   * Set the state of a session
   * @param session The session to set the state for
   * @param newState The new state
   * @param cancellable If the state change should be cancellable
   * @returns The abort signal if the state change is cancellable, otherwise null
   */
  public setSessionState(
    session: SessionState,
    newState: ChatState,
    cancellable: boolean,
  ) {
    session.state = newState;
    session._data.abortController = cancellable ? new AbortController() : null;
    return session._data.abortController?.signal ?? null;
  }

  /**
   * Reset the state of a session to `ChatState.Start`
   * @param session The session to reset the state for
   * @returns True if the state was cancelled, false otherwise
   */
  public resetSessionState(session: SessionState) {
    session.state = ChatState.Start;
    if (
      session._data.abortController &&
      !session._data.abortController.signal.aborted
    ) {
      session._data.abortController.abort();
      return true;
    }
    return false;
  }

  /**
   * [Subscribe](https://valtio.pmnd.rs/docs/api/advanced/subscribe) to changes in the state.
   * @example
   * ```ts
   * const state = stateMachine.create({ count: 0 });
   * stateMachine.subscribe(state, (value) => console.log(value.count));
   * state.count++;
   * ```
   *
   * You can also subscribe to a portion of state.
   * @example
   * ```ts
   * const state = stateMachine.create(({ obj: { foo: 'bar' }, arr: ['hello'] });
   * stateMachine.subscribe(.obj, () => console.log('state.obj has changed to', state.obj));
   * state.count++;
   * ```
   * @param proxy
   * @param callback
   * @returns
   */
  public subscribe = subscribe;

  /**
   * [snapshot](https://valtio.pmnd.rs/docs/api/advanced/snapshot) takes a proxy and returns an immutable object, unwrapped from the proxy.
   * Immutability is achieved by *efficiently* deep copying & freezing the object.
   *
   * @example
   * ```ts
   * const store = stateMachine.create({ name: 'Mika' })
   * const snap1 = stateMachine.snapshot(store) // an efficient copy of the current store values, unproxied
   * const snap2 = stateMachine.snapshot(store)
   * console.log(snap1 === snap2) // true, no need to re-render
   *
   * store.name = 'Hanna'
   * const snap3 = stateMachine.snapshot(store)
   * console.log(snap1 === snap3) // false, should re-render

   * ```
   */
  public snapshot = snapshot;

  /**
   * A [ref](https://valtio.pmnd.rs/docs/api/advanced/ref) allows unproxied state in a proxy state.
   * A `ref` is useful in the rare instances you to nest an object in a `proxy` that is not wrapped in an inner proxy and, therefore, is not tracked.
   * @example
   * ```ts
   * const store = stateMachine.create({
   *     users: [
   *         { id: 1, name: 'Juho', uploads: ref([]) },
   *     ]
   *   })
   * })
   * ```
   * Once an object is wrapped in a ref, it should be mutated without resetting the object or rewrapping in a new ref.
   * @example
   * ```ts
   * // do mutate
   * store.users[0].uploads.push({ id: 1, name: 'Juho' })
   * // do reset
   * store.users[0].uploads.splice(0)
   *
   * // don't
   * store.users[0].uploads = []
   * ```
   * A ref should also not be used as the only state in a proxy, making the proxy usage pointless.
   */
  public ref = ref;

  /**
   * subscription via a getter.
   * [watch](https://valtio.pmnd.rs/docs/api/utils/watch) supports subscribing to multiple proxy objects (unlike `subscribe` which listens to only a single proxy). Proxy objects are subscribed with a `get` function passed to the callback.
   *
   * Any changes to the proxy object (or its child proxies) will rerun the callback.
   */
  public watch = watch;
}

import { BaseService } from "../core/index.ts";
import {  Singleton,
} from "../deps/index.ts";
import { EventService } from "./event.service.ts";
import { KeyboardService } from "./keyboard.service.ts";
import { ChatState, StateMachineEvent } from "../enums/index.ts";

import type {
  AppContext,
  StateSession,
  StateSettings,
} from "../types/index.ts";

/**
 * State machine service
 * * More or less just a injectable wrapper for [valtio](https://github.com/pmndrs/valtio) (vanillla-version)
 * * Can be enriched with its own functionalities if needed
 * * Used to create a proxy state object using {@link StateMachineService.create} for each chat session (sessions are handled using [Grammy's session plugin](https://grammy.dev/plugins/session))
 * * Changes on the state (or any sub property) can be subscribed using {@link StateMachineService.subscribe}.
 */
@Singleton()
export class StateMachineService extends BaseService {
  private _settings: StateSettings;

  get settings(): StateSettings {
    return this._settings;
  }

  constructor(
    protected readonly event: EventService,
    protected readonly keyboard: KeyboardService,
  ) {
    super();
    this._settings = this.getInitialSettings();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Create a new session state object for a chat session handled by Grammy's session plugin.
   * @returns
   */
  public getInitialSettings(): StateSettings {
    const _settings = {
      general: {
        organisationName: "",
        logoUrl: "",
        siteUrl: "",
        supportEmail: "",
        privacyLink: "",
        termsLink: "",
        impressumLink: "",
        locale: "en",
        theme: {},
        currencyCode: "EUR",
        currencySymbol: "€",
        backgroundUrl: "",
        hideContribution: false,
        footerLinks: [],
      },
      telegram: {
        welcomeMessageMd: "",
      },
    };

    return _settings;
  }

  public getInitialSession(): StateSession {
    return {
      state: ChatState.Initial,
      _data: {
        ctx: null,
        abortController: null,
        latestKeyboard: null,
      },
    };
  }

  protected onSessionChanged(ctx: AppContext) {
    this.event.emit(StateMachineEvent.SESSION_CHANGED, ctx);
  }

  /**
   * Set the state of a session
   * @param session The session to set the state for
   * @param newState The new state
   * @param cancellable If the state change should be cancellable
   * @returns The abort signal if the state change is cancellable, otherwise null
   */
  public async setSessionState(
    ctx: AppContext,
    newState: ChatState,
    cancellable: boolean,
  ) {
    // Reset the last session state
    await this.resetSessionState(ctx);
    const session = await ctx.session;
    session.state = newState;
    session._data.abortController = cancellable ? new AbortController() : null;
    this.onSessionChanged(ctx);
    return session._data.abortController?.signal ?? null;
  }

  /**
   * Reset the state of a session
   * @param session The session to reset the state for
   * @returns True if the state was cancelled, false otherwise
   */
  protected async resetSessionState(ctx: AppContext) {
    const session = await ctx.session;

    await this.keyboard.removeLastInlineKeyboard(ctx);

    if (session._data.abortController) {
      console.debug("Aborting session");
      session._data.abortController.abort();
      return true;
    }
    console.debug("Session is not cancellable");
    return false;
  }
}

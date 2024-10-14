import { BaseService } from "../core/index.ts";
import { Singleton } from "../deps/index.ts";
import { EventService } from "./event.service.ts";
import { KeyboardService } from "./keyboard.service.ts";
import {
  AbortControllerState,
  ChatState,
  StateMachineEvent,
} from "../enums/index.ts";
import { getSessionKey } from "../utils/index.ts";

import type {
  AppContext,
  SessionNonPersisted,
  SessionPersisted,
  StateSettings,
} from "../types/index.ts";

/**
 * State machine service.
 * Contains the current settings, session data which can't be persisted for each chat session
 * and methods to handle the session state.
 */
@Singleton()
export class StateMachineService extends BaseService {
  protected _settings = this.getInitialSettings();

  protected _nonPersisted: { [sessionKey: string]: SessionNonPersisted } = {};

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

  public getInitialSession(): SessionPersisted {
    return {
      state: ChatState.Initial,
      latestKeyboard: null,
      abortControllerState: AbortControllerState.NULL,
    };
  }

  public getInitialNonPersisted(): SessionNonPersisted {
    return {
      abortController: null,
    };
  }

  protected onSessionChanged(ctx: AppContext) {
    this.event.emit(StateMachineEvent.SESSION_CHANGED, ctx);
  }

  public async getNonPersisted(ctx: AppContext): Promise<SessionNonPersisted> {
    const sessionKey = getSessionKey(ctx);
    if (!this._nonPersisted[sessionKey]) {
      this._nonPersisted[sessionKey] = this.getInitialNonPersisted();
      await this.restoreAbortController(ctx);
    }
    return this._nonPersisted[sessionKey];
  }

  /**
   * Set the state of a session
   * @param ctx The context which contains the session
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
    const abortController = await this.setAbortController(
      ctx,
      cancellable ? new AbortController() : null,
    );
    this.onSessionChanged(ctx);
    return abortController ? abortController.signal : null;
  }

  /**
   * Reset the state of a session
   * @param ctx The context which contains the session
   * @returns True if the state was cancelled, false otherwise
   */
  protected async resetSessionState(ctx: AppContext) {
    await this.keyboard.removeLastInlineKeyboard(ctx);
    const nonPersisted = await this.getNonPersisted(ctx);

    if (nonPersisted.abortController) {
      console.debug("Aborting session");
      nonPersisted.abortController.abort();
      return true;
    }
    console.debug("Session is not cancellable");
    return false;
  }

  protected async setAbortController(
    ctx: AppContext,
    abortController: AbortController | null,
  ) {
    const session = await ctx.session;
    const nonPersisted = await this.getNonPersisted(ctx);
    nonPersisted.abortController = abortController;
    session.abortControllerState = this.determineAbortControllerState(
      nonPersisted.abortController,
    );
    if (abortController) {
      abortController.signal.addEventListener("abort", () => {
        session.abortControllerState = AbortControllerState.ABORTED;
      }, { once: true });
    }

    return abortController;
  }

  /**
   * Determine the state of the abort controller
   * @param abortController The abort controller
   * @returns The state of the abort controller
   */
  protected determineAbortControllerState(
    abortController: AbortController | null,
  ) {
    if (!abortController) {
      return AbortControllerState.NULL;
    }
    return abortController.signal.aborted
      ? AbortControllerState.ABORTED
      : AbortControllerState.ACTIVE;
  }

  protected async restoreAbortController(ctx: AppContext) {
    const session = await ctx.session;
    const nonPersisted = await this.getNonPersisted(ctx);
    // Already restored
    if (nonPersisted.abortController) {
      return;
    }
    this.setAbortController(
      ctx,
      session.abortControllerState === AbortControllerState.ACTIVE
        ? new AbortController()
        : null,
    );
  }
}

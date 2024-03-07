import { container } from "../deps.ts";
import { EventService } from "../services/event.service.ts";

export abstract class BaseEventManager {
  /**
   * Get a singleton instance of the event manager.
   * This method makes use of the [dependency injection](https://alosaur.com/docs/basics/DI#custom-di-container) container to resolve the service.
   * @param this
   * @returns An instance of the class that extends BaseEventManager.
   */
  static getSingleton<T extends BaseEventManager>(
    // deno-lint-ignore no-explicit-any
    this: new (...args: any[]) => T,
  ): T {
    return container.resolve(this);
  }

  protected abstract readonly event: EventService;

  /**
   * Add event listeners to the event manager
   */
  public abstract init(): void;
}

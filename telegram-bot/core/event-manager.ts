import { EventService } from "../services/index.ts";

export abstract class EventManager {
  protected abstract readonly event: EventService;

  /**
   * Add event listeners to the event manager
   */
  public abstract init(): void;
}

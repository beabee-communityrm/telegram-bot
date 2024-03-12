import { BaseService } from "../core/index.ts";
import { Singleton } from "../deps/index.ts";
import { SubscriberModel } from "../models/index.ts";
import { DatabaseService } from "./database.service.ts";
import { getIdentifier } from "../utils/index.ts";

import type { AppContext, Subscriber } from "../types/index.ts";

/**
 * Handle subscriptions to a Callout.
 * Just a prove of concept and not fully implemented for now and shows Shows how TypeORM can be used with Deno.
 */
@Singleton() // See https://github.com/alosaur/alosaur/tree/master/src/injection
export class SubscriberService extends BaseService {
  /**
   * @param db DatabaseService injected to make sure the database is initialized
   */
  constructor(private readonly db: DatabaseService) {
    super();
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Transform a telegram context to an anonymous subscriber
   * @param ctx
   * @returns
   */
  private transformAnonymous(ctx: AppContext) {
    const id = getIdentifier(ctx);
    const subscriber = new SubscriberModel();
    subscriber.id = id;
    subscriber.anonymityStatus = "full";
    return subscriber;
  }

  /**
   * Transform a telegram context to a subscriber
   * @param ctx
   * @param forceAnonymous
   * @returns
   */
  private transform(ctx: AppContext, forceAnonymous = false) {
    if (!ctx.from || forceAnonymous) return this.transformAnonymous(ctx);
    const id = getIdentifier(ctx);

    const subscriber = new SubscriberModel();
    subscriber.id = id;
    subscriber.anonymityStatus = "none";
    subscriber.first_name = ctx.from.first_name || null;
    subscriber.last_name = ctx.from.last_name || null;
    subscriber.username = ctx.from.username || null;
    subscriber.language_code = ctx.from.language_code || null;
    subscriber.is_bot = ctx.from.is_bot || false;
    return subscriber;
  }

  /**
   * Check if a subscriber exists
   * @param id Id of the subscriber
   * @returns
   */
  public async exists(id: number) {
    return await this.db.manager.exists(SubscriberModel, {
      where: { id },
    });
  }

  /**
   * Create / add a new subscriber
   * @param ctx
   * @returns
   */
  public async create(
    ctx: AppContext,
  ): Promise<(SubscriberModel & Subscriber) | null> {
    const id = getIdentifier(ctx);
    if (await this.exists(id)) {
      console.debug("Subscriber already exists", id);
      return null;
    }
    const subscriber = this.transform(ctx);
    console.debug("New subscriber", subscriber);

    const result = await this.db.manager.save(subscriber);
    return result;
  }

  /**
   * Update a subscriber
   * @param ctx
   * @returns
   */
  public async update(ctx: AppContext) {
    const data = this.transform(ctx);
    const result = await this.db.manager.update(SubscriberModel, data.id, data);
    return result;
  }

  /**
   * Delete a subscriber
   * @param ctx
   * @returns
   */
  public async delete(ctx: AppContext) {
    const id = getIdentifier(ctx);
    const result = await this.db.manager.delete(SubscriberModel, id);
    return result;
  }

  /**
   * Get a all subscribers
   * @returns All subscribers
   */
  public async all(): Promise<Array<SubscriberModel & Subscriber>> {
    return await this.db.manager.find(SubscriberModel);
  }
}

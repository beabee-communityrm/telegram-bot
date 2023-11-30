import { Injectable } from 'alosaur/mod.ts';
import { SubscriberModel } from '../models/index.ts';
import { DatabaseService } from './database.service.ts';

import type { Context } from "grammy/mod.ts";
import type { Subscriber } from '../types/index.ts';

@Injectable() // See https://github.com/alosaur/alosaur/tree/master/src/injection
export class SubscriberService {

    /**
     * 
     * @param _ DatabaseService injected to make sure the database is initialized
     */
    constructor(private readonly db: DatabaseService) {
    }

    /**
     * Transform a telegram context to an anonymous subscriber
     * @param ctx 
     * @returns 
     */
    private transformAnonymous(ctx: Context) {
        const id = this.getIdentifier(ctx);
        const subscriber = new SubscriberModel()
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
    private transform(ctx: Context, forceAnonymous = false) {
        if (!ctx.from || forceAnonymous) return this.transformAnonymous(ctx);
        const id = this.getIdentifier(ctx);

        const subscriber = new SubscriberModel()
        subscriber.id = id;
        subscriber.anonymityStatus = "none";
        subscriber.first_name = ctx.from.first_name || null;
        subscriber.last_name = ctx.from.last_name || null;
        subscriber.username = ctx.from.username || null;
        subscriber.language_code = ctx.from.language_code || null;
        subscriber.is_bot = ctx.from.is_bot || false;
        return subscriber;
    }

    private getIdentifier(ctx: Context) {
        const id = ctx.chat?.id || ctx.from?.id;
        if (!id) throw new Error("No id found on context");
        return id;
    }

    /**
     * Check if a subscriber exists
     * @param id Id of the subscriber
     * @returns 
     */
    public async exists(id: number) {
        return await this.db.manager.exists(SubscriberModel, {
            where: { id }
        });
    }

    /**
     * Create / add a new subscriber
     * @param ctx 
     * @returns 
     */
    public async create(ctx: Context): Promise<(SubscriberModel & Subscriber) | null> {
        const id = this.getIdentifier(ctx);
        if (await this.exists(id)) {
            console.debug("Subscriber already exists", id);
            return null;
        }
        const subscriber = this.transform(ctx);
        console.debug("New subscriber", subscriber);

        const result = await this.db.manager.save(subscriber)
        return result;
    }

    /**
     * Update a subscriber
     * @param ctx 
     * @returns 
     */
    public async update(ctx: Context) {
        const data = this.transform(ctx);
        const result = await this.db.manager.update(SubscriberModel, data.id, data);
        return result;
    }

    /**
     * Delete a subscriber
     * @param ctx 
     * @returns 
     */
    public async delete(ctx: Context) {
        const id = this.getIdentifier(ctx);
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
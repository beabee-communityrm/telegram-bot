import { Singleton } from 'alosaur';
import { SubscriberModel } from '../models/index.ts';
import { DatabaseService } from './db.service.ts';

import type { Context } from "grammy";
import type { Subscriber } from '../types/index.ts';

@Singleton() // See https://github.com/alosaur/alosaur/tree/master/src/injection
export class SubscriberService {

    private model = SubscriberModel;

    /**
     * 
     * @param _ DatabaseService injected to make sure the database is initialized
     */
    constructor(_: DatabaseService) {
    }

    /**
     * Transform a telegram context to an anonymous subscriber
     * @param ctx 
     * @returns 
     */
    private transformAnonymous(ctx: Context): Subscriber {
        const id = this.getIdentifier(ctx);
        return {
            id,
            first_name: null,
            last_name: null,
            username: null,
            language_code: null,
            is_bot: null,
            anonymityStatus: "full"
        };
    }

    /**
     * Transform a telegram context to a subscriber
     * @param ctx 
     * @param forceAnonymous 
     * @returns 
     */
    private transform(ctx: Context, forceAnonymous = false): Subscriber {
        if(!ctx.from || forceAnonymous) return this.transformAnonymous(ctx);
        const id = this.getIdentifier(ctx);
        return {
            id,
            anonymityStatus: "none",
            first_name: ctx.from.first_name || null,
            last_name: ctx.from.last_name || null,
            username: ctx.from.username || null,
            language_code: ctx.from.language_code || null,
            is_bot: ctx.from.is_bot || false,
        };
    }

    private getIdentifier(ctx: Context) {
        const id = ctx.chat?.id || ctx.from?.id;
        if(!id) throw new Error("No id found on context");
        return id;
    }

    /**
     * Check if a subscriber exists
     * @param id Id of the subscriber
     * @returns 
     */
    public async exists(id: number) {
        const first = (await this.model.where('id', id).first()) as SubscriberModel | undefined;
        return !!first;
    }

    /**
     * Create / add a new subscriber
     * @param ctx 
     * @returns 
     */
    public async create(ctx: Context): Promise<SubscriberModel | null> {
        const id = this.getIdentifier(ctx);
        if(await this.exists(id)) {
            console.debug("Subscriber already exists", id);
            return null;
        }
        const data = this.transform(ctx);
        console.debug("New subscriber", data);
        const result = await this.model.create({ ...data });
        return result;
    }

    /**
     * Create or update a subscriber
     * @param ctx 
     * @returns 
     */
    public async createOrUpdate(ctx: Context): Promise<SubscriberModel> {
        const id = ctx.chat?.id || ctx.from?.id;
        if(await this.exists(id || 0)) {
            return this.update(ctx);
        }
        return this.create(ctx) as Promise<SubscriberModel>;
    }

    /**
     * Update a subscriber
     * @param ctx 
     * @returns 
     */
    public async update(ctx: Context): Promise<SubscriberModel> {
        const data = this.transform(ctx);
        const result = await this.model.where('id', data.id).update({ ...data });        
        return result as SubscriberModel;
    }

    /**
     * Delete a subscriber
     * @param ctx 
     * @returns 
     */
    public async delete(ctx: Context): Promise<SubscriberModel> {
        const id = this.getIdentifier(ctx);
        const result = await this.model.deleteById(id);
        return result as SubscriberModel;
    }

    /**
     * Get a all subscribers
     * @returns All subscribers
     */
    public async all(): Promise<SubscriberModel[]> {
        return await this.model.all();
    }


}
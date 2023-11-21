import { Singleton } from 'alosaur';

import type { Context } from "grammy";
import type { Subscriber, SubscriberAnonymous } from '../types/index.ts';

@Singleton() // See https://github.com/alosaur/alosaur/tree/master/src/injection
export class SubscriberService {

    /**
     * Track subscriptions
     * TODO: Use subscriber model here
     **/
    protected _subscriptions: Array<Subscriber | SubscriberAnonymous> = [];


    public add(ctx: Context): SubscriberAnonymous | Subscriber {
        console.debug("New subscriber", ctx.from);

        // TODO force anonymous
        if (ctx.from) {
            this._subscriptions.push(this.create(ctx));
        } else {
            this._subscriptions.push(this.createAnonymous(ctx));
        }
        
        return this._subscriptions[this._subscriptions.length - 1];
    }

    public remove(ctx: Context): Subscriber | SubscriberAnonymous | undefined {
        const index = this._subscriptions.findIndex((subscriber) => subscriber.id === ctx.chat?.id || subscriber.id === ctx.from?.id);
        if(index <= -1) return undefined;
        return this._subscriptions.splice(index, 1)[0];
    }

    public get all(): Array<Subscriber | SubscriberAnonymous> {
        return this._subscriptions;
    }

    protected createAnonymous(ctx: Context): SubscriberAnonymous {
        const id = ctx.chat?.id || ctx.from?.id;

        if(!id) throw new Error("No id found on context");
        return {
            id,
            anonymityStatus: "full"
        };
    }

    protected create(ctx: Context): Subscriber {
        if(!ctx.from) throw new Error("No from found on context");
        return {
            id: ctx.from.id,
            anonymityStatus: "none",
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username,
            language_code: ctx.from.language_code,
            is_bot: ctx.from.is_bot,
        };
    }
}
import { Singleton, container } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { SubscriberService } from '../services/index.ts';

import type { Context } from "grammy/context.ts";

@Singleton()
export class UnsubscribeCommand implements Command {
    command = 'unsubscribe';
    description = 'Unsubscribe from a Callout';

    get subscriber() {
        return container.resolve(SubscriberService);
    }

    constructor() {
        // this.subscriber = subscriber;
    }

    async action(ctx: Context) {
        this.subscriber.delete(ctx)
        await ctx.reply("You are now unsubscribed\!");
    }
}
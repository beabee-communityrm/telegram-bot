import { Singleton, container } from 'alosaur/mod.ts';
import { Command } from '../types/command.ts';
import { SubscriberService } from '../services/index.ts';

import type { Context } from "grammy/context.ts";

@Singleton()
export class SubscribeCommand implements Command {
    command = 'subscribe';
    description = 'Subscribe a Callout';

    get subscriber() {
        return container.resolve(SubscriberService);
    }

    constructor() {
        // this.subscriber = subscriber;
    }

    async action(ctx: Context) {
        this.subscriber.create(ctx)
        await ctx.reply("You are now subscribed\!");
    }
}
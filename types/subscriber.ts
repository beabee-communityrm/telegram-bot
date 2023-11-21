import type { SubscriberAnonymous } from './index.ts';
import type { User } from 'grammy_types';

/**
 * A subscriber is a telegram user who has subscribed to a channel.
 */
export interface Subscriber extends User, SubscriberAnonymous {
    /**
     * If anonymity status is `'full'`,
     * the user's private profile properties like `first_name` are optional.
     * If anonymity status is `'none'`,
     * the user's private profile properties like `first_name` are required.
     * 
     * `'partial'` is a placeholder for a future feature.
     */
    anonymityStatus: 'full' | 'partial' | 'none'; // 'none' in this case
}
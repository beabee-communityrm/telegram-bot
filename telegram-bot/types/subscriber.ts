import type { NullableProperties } from './index.ts';
import type { User } from 'grammy_types/mod.ts';

/**
 * A subscriber is a telegram user who has subscribed to a channel.
 */
export interface Subscriber extends NullableProperties<User> {
    /** Unique identifier for this user or bot. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. */
    id: User['id'];
    /**
     * If anonymity status is `'full'`,
     * the user's private profile properties like `first_name` are optional.
     * If anonymity status is `'none'`,
     * the user's private profile properties like `first_name` are required.
     * 
     * `'partial'` is a placeholder for a future feature.
     */
    anonymityStatus: 'full' | 'partial' | 'none';
}

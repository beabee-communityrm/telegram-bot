import { Singleton } from 'alosaur/mod.ts';
import { InlineKeyboard } from "grammy/mod.ts";

import type { CalloutDataExt } from "../types/index.ts";

/**
 * Service to create Telegram keyboard buttons
 */
@Singleton()
export class KeyboardService {

    /**
     * Create a keyboard button to select a callout
     * @param startIndex The index of the first callout to show, starting at 1
     * @param endIndex The index of the last callout to show, starting at 1 and must be larger than startIndex
     */
    public calloutSelection(callouts: CalloutDataExt[], startIndex = 1, endIndex = callouts.length) {
        const inlineKeyboard = new InlineKeyboard();
        if (startIndex < 1) {
            throw new Error("startIndex must be larger than 0");
        }
        if (endIndex < startIndex) {
            throw new Error("endIndex must be larger than startIndex");
        }
        if (endIndex > callouts.length) {
            throw new Error("endIndex is larger than callouts.length");
        }
        for (let i = startIndex; i <= endIndex; i++) {
            inlineKeyboard.text(`${i}`, `show-callout-slug:${callouts[i - 1].slug}`);
        }
        return inlineKeyboard;
    }
}
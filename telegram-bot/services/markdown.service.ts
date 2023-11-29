import { Singleton } from 'alosaur/mod.ts';
import { escapeMd } from '../utils/index.ts';

import { CalloutDataExt } from "../types/index.ts";

@Singleton()
export class MarkdownService {

    public calloutListItem(callout: CalloutDataExt, listChar = '\\-') {
        listChar = escapeMd(listChar);
        if (callout.slug) {
            return `${listChar} [${escapeMd(callout.title)}](${callout.url})\n`;
        } else {
            return `${listChar} ${escapeMd(callout.title)}\n`;
        }

    }

    public calloutsListItems(callouts: CalloutDataExt[]) {
        let text = `*List of active callouts*\n\n`;
        let p = 1;
        for (const callout of callouts) {
            text += `${this.calloutListItem(callout, `${p}.`)}`;
        }

        return text;
    }
}
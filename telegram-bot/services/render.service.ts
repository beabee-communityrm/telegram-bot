import { Injectable } from 'alosaur/mod.ts';
import { escapeMd, downloadImage } from '../utils/index.ts';
import { InputMediaBuilder, InputFile } from "grammy/mod.ts";
import { RenderResultType } from "../enums/index.ts";

import type { CalloutDataExt, RenderResult } from "../types/index.ts";

/**
 * Service to render callouts for Telegram messages in Markdown
 */
@Injectable()
export class RenderService {

    /**
     * Render a single callout in Markdown
     * @param callout 
     * @param listChar 
     * @returns 
     */
    public calloutListItem(callout: CalloutDataExt, listChar = '\\-') {
        const result: RenderResult = {
            type: RenderResultType.MARKDOWN,
            markdown: '',
        };
        listChar = escapeMd(listChar);
        if (callout.slug) {
            result.markdown = `${listChar} [${escapeMd(callout.title)}](${callout.url})\n`;
        } else {
            result.markdown = `${listChar} ${escapeMd(callout.title)}\n`;
        }
        return result;
    }

    /**
     * Render a list of callouts in Markdown
     * @param callouts 
     * @returns 
     */
    public calloutListItems(callouts: CalloutDataExt[]) {
        const result: RenderResult = {
            type: RenderResultType.MARKDOWN,
            markdown: '',
        };
        if (callouts.length === 0) {
            result.markdown = 'There are currently no active callouts';
            return result;
        }

        result.markdown = `*List of active callouts*\n\n`;
        let p = 1;
        for (const callout of callouts) {
            result.markdown += `${this.calloutListItem(callout, `${p}.`).markdown}`;
            p++;
        }

        return result;
    }

    /**
     * Render a callout as a photo
     * @param callout 
     * @returns 
     */
    public async callout(callout: CalloutDataExt) {
        const imagePath = await downloadImage(callout.image);
        const inputFile = new InputFile(await Deno.open(imagePath), callout.title);

        // TODO: Add URL to callout
        const captionMd = `*${escapeMd(callout.title)}*\n\n${escapeMd(callout.excerpt)}`;
        const calloutImage = InputMediaBuilder.photo(inputFile, { caption: captionMd, parse_mode: "MarkdownV2" });

        const result: RenderResult = {
            type: RenderResultType.PHOTO,
            photo: calloutImage,
        };

        return result;
    }
}
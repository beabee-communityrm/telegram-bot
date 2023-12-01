import { Singleton } from 'alosaur/mod.ts';
import { escapeMd, downloadImage } from '../utils/index.ts';
import { InputMediaBuilder, InputFile } from "grammy/mod.ts";
import { RenderResultType } from "../enums/index.ts";

import type { CalloutDataExt, RenderResult } from "../types/index.ts";
import type { Context } from "grammy/context.ts";

/**
 * Service to render callouts for Telegram messages in Markdown
 */
@Singleton()
export class RenderService {

    /**
     * Render a single callout line item in Markdown
     * @param callout 
     * @param listChar 
     * @returns 
     */
    public calloutListItem(callout: CalloutDataExt, listChar = '\\-') {
        listChar = escapeMd(listChar);

        const result: RenderResult = {
            type: RenderResultType.MARKDOWN,
            markdown: `${listChar} ${this.calloutTitle(callout).markdown}\n`,
        };

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
     * Render a callout title in Markdown
     * @param callout The callout to render
     * @param withUrl Whether to include the URL in the title
     * @returns 
     */
    public calloutTitle(callout: CalloutDataExt, withUrl = true) {
        const result: RenderResult = {
            type: RenderResultType.MARKDOWN,
            markdown: '',
        };

        if (withUrl && callout.url) {
            result.markdown = `*[${escapeMd(callout.title)}](${callout.url})*`;
        } else {
            result.markdown = `*${escapeMd(callout.title)}*`;
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
        let captionMd = this.calloutTitle(callout).markdown;
        captionMd += `\n\n${escapeMd(callout.excerpt)}`;
        const calloutImage = InputMediaBuilder.photo(inputFile, { caption: captionMd, parse_mode: "MarkdownV2" });

        const result: RenderResult = {
            type: RenderResultType.PHOTO,
            photo: calloutImage,
        };

        return result;
    }

    /**
     * Automatically reply to a message with a render result
     * @param ctx 
     * @param res 
     */
    public async reply(ctx: Context, res: RenderResult) {
        if (res.type === RenderResultType.PHOTO) {
            await ctx.replyWithMediaGroup([res.photo]);
        } else {
            await ctx.reply(res.markdown, { parse_mode: "MarkdownV2" });
        }
    }
}
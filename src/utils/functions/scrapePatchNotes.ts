import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';

import { LimitedCollection } from 'seyfert';
import { Formatter } from 'seyfert';
import * as cheerio from 'cheerio';

import { ElementType } from '../../../node_modules/cheerio/node_modules/domhandler/node_modules/domelementtype/lib/esm';

interface PatchNotes {
    title: string;
    date: string;
    content: string[];
    metadata: {
        url: string;
        imageUrl: string;
        title: string;
        description: string;
    };
}

const cleanText = (text: string): string => text
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const processContent = ($: CheerioAPI, $element: cheerio.Cheerio<Element>, isSocialBlock: boolean): string[] => {
    const content: string[] = [];

    $element.contents().each((_, el) => {
        const $el = $(el);

        if (el.type === ElementType.Text) {
            const text = cleanText($el.text());
            if (text && text !== '|') {
                content.push(text);
            }
        } else if (el.type === ElementType.Tag && el.name === 'strong') {
            const text = cleanText($el.text());
            if (text) {
                content.push(`**${text}**`);
            }
        } else if (el.type === ElementType.Tag && (el.name === 'h2' || el.name === 'h3')) {
            const text = cleanText($el.text());
            if (text) {
                content.push(`__**${text}**__`);
            }
        } else if (el.type === ElementType.Tag && el.name === 'a' && !isSocialBlock) {
            const text = cleanText($el.text());
            if (text) {
                content.push(`[${text}](${$el.attr('href') ?? '#'})`);
            }
        }
    });

    return content.filter(Boolean);
};

const extractContent = ($: CheerioAPI, $elements: cheerio.Cheerio<Element>): string[] => {
    const content: string[] = [];
    let isSocialBlock = false;

    $elements.each((_, element) => {
        const $element = $(element);
        const tagName = $element.prop('tagName')?.toLowerCase();

        if ($element.text().includes('For more information about us, check out and follow our other social channels.')) {
            isSocialBlock = true;
        }

        if (tagName === 'p' || tagName === 'ul' || tagName === 'ol' || tagName?.startsWith('h')) {
            const processedContent = processContent($, $element, isSocialBlock);
            content.push(...processedContent);
        }

        if (isSocialBlock && $element.text().includes('Twitch')) {
            isSocialBlock = false;
        }
    });

    return content;
};

const formatSocialLinks = (content: string[]): string[] => {
    const socialText = 'For more information about us, check out and follow our other social channels.';
    const socialLinks = [
        '[Discord](https://discord.gg/marvelrivals)',
        '[X](https://twitter.com/MarvelRivals)',
        '[Facebook](https://www.facebook.com/marvelrivals)',
        '[Instagram](https://www.instagram.com/marvelrivals/)',
        '[TikTok](https://www.tiktok.com/@marvelrivals)',
        '[YouTube](https://www.youtube.com/@MarvelRivals)',
        '[Twitch](https://www.twitch.tv/marvelrivals)'
    ];

    const socialTextIndex = content.findIndex((line) => line.includes(socialText));

    if (socialTextIndex !== -1) {
        const nextLine = content.at(socialTextIndex + 1);
        if (nextLine?.includes('|')) {
            content.splice(socialTextIndex + 1, 1);
        }

        content.splice(socialTextIndex, 1, Formatter.italic(socialText), socialLinks.join(' | '));
    }

    return content;
};

const getLatestPatchInfo = async (): Promise<{
    url: string;
    imageUrl: string;
    title: string;
    description: string;
} | null> => {
    try {
        const controller = new AbortController();
        const request = new Request('https://www.marvelrivals.com/gameupdate/', {
            signal: controller.signal
        });
        setTimeout(() => {
            controller.abort();
        }, 10e3);
        const data = await (await fetch(request)).text();
        const $ = cheerio.load(data);

        const firstItem = $('.list-item').first();
        if (!firstItem.length) {
            return null;
        }

        const url = firstItem.attr('href') ?? '';
        const imageUrl = firstItem.find('.img img').attr('src') ?? '';
        const title = firstItem.find('h2').text().trim();
        const description = firstItem.find('p').text().trim();

        return {
            url,
            imageUrl,
            title,
            description
        };
    } catch (error) {
        console.error('Error fetching latest patch info:', error);
        return null;
    }
};

const patchNotesCache = new LimitedCollection<string, PatchNotes>({
    expire: 60 * 60e3
});

export async function scrapePatchNotes(): Promise<PatchNotes | null> {
    const CACHE_KEY = 'latest_patch';

    if (patchNotesCache.has(CACHE_KEY)) {
        return patchNotesCache.get(CACHE_KEY)!;
    }

    try {
        const latestPatch = await getLatestPatchInfo();
        if (!latestPatch) {
            return null;
        }

        const { url } = latestPatch;
        const controller = new AbortController();
        const request = new Request(url, {
            signal: controller.signal
        });
        setTimeout(() => {
            controller.abort();
        }, 10e3);
        const data = await (await fetch(request)).text();

        const $ = cheerio.load(data);

        const title = $('.artTitle').text().trim();
        const date = $('.date').text().trim();

        if (!title || !date) {
            throw new Error('Could not find the title or date on the page.');
        }

        const $artText = $('.artText');
        let content = extractContent($, $artText.children());

        if (content.length === 0) {
            throw new Error('No content was found in the patch notes.');
        }

        content = formatSocialLinks(content);

        const result = {
            title,
            date,
            content,
            metadata: latestPatch
        };

        patchNotesCache.set(CACHE_KEY, result);
        return result;
    } catch (error) {
        console.error('Error scraping last patch-notes:', error);
        throw error;
    }
}

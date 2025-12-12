import { loadImage } from '@napi-rs/canvas';
import { join } from 'node:path';

import { getRankDetails } from '../functions/rank-utils';
import { STICKY_CDN_DOMAIN } from '../env';

async function loadImageFromCache(
    cacheDir: string,
    id: string | number,
    fetchURL: string
) {
    const path = join(process.cwd(), 'cache', cacheDir, `${id}.png`);
    const file = Bun.file(path);
    if (await file.exists()) {
        return loadImage(path);
    }
    const response = await fetch(fetchURL);
    if (!response.ok) {
        console.log({ fetchURL });
        const placeholderPath = join(process.cwd(), 'assets', 'placeholders', `${cacheDir}.png`);
        const placeholdersFile = Bun.file(placeholderPath);
        if (await placeholdersFile.exists()) {
            return loadImage(placeholderPath);
        }
        throw new Error(`Failed to fetch ${fetchURL}`);
    }
    const bytes = await response.bytes();
    await Bun.write(path, bytes);
    return loadImage(path);
}

export function loadUserIcon(iconID: string) {
    return loadImageFromCache(
        'user_icon',
        iconID,
        `${STICKY_CDN_DOMAIN}/Content/Marvel/UI/Textures/Show/Playerhead/img_playerhead_${iconID}.png`
    );
}

export function loadHeroHistory(heroID: number) {
    return loadImageFromCache(
        'hero_history',
        heroID,
        getHeroHistoryLink(heroID)
    );
}

export function loadRankIcon(level: number) {
    const { image, rank } = getRankDetails(level);
    return loadImageFromCache(
        'rank_icon',
        rank,
        image
    );
}

export function loadHeroSquare(hero_id: number) {
    return loadImageFromCache(
        'hero_square',
        hero_id,
        `${STICKY_CDN_DOMAIN}/Content/Marvel_LQ/UI/Textures/HeroPortrait/SelectHero/img_selecthero_${hero_id}001.png`
    );
}

export function getHeroHistoryLink(heroID: number | string) {
    switch (heroID) {
        // hulk
        case '1011':
        case 1_011:
            return `${STICKY_CDN_DOMAIN}/Content/Marvel/UI/Textures/HeroGallery_V3/HeroDetail/Story/Dynamic/img_herostory_${heroID}11_hover.png`;
    }
    return `${STICKY_CDN_DOMAIN}/Content/Marvel/UI/Textures/HeroGallery_V3/HeroDetail/Story/Dynamic/img_herostory_${heroID}01_hover.png`;
}

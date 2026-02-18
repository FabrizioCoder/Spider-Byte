
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { join } from 'node:path';

import type { HeroesRanked, PlayerDTO } from '../../types/dtos/PlayerDTO';
import type { HeroesDTO } from '../../types/dtos/HeroesDTO';
import type { Mutable } from '../types';

import { getPixelWithCanvas, drawCircularImage, drawRotatedImage, roundedRect } from './utils';
import { loadHeroHistory, loadHeroSquare, loadUserIcon } from './_';
import { Role } from '../../types/dtos/HeroesDTO';
import { STICKY_CDN_DOMAIN } from '../env';

function getRankPath(rank: string) {
    let p: string;
    if (rank.includes('All')) {
        p = 'one_above_all.png';
    } else {
        const rankName = rank.split(' ')[0].toLowerCase();
        p = `${rankName}.png`;
    }
    return join(process.cwd(), 'assets', 'ranks', p);
}

export async function generateProfileV2(data: PlayerDTO, allHeroes: HeroesDTO[], gameMode: 'ranked' | 'casual' | 'both' = 'both') {
    let concatedHeroes: HeroesRanked[];
    let kills: string;
    let kdaRatio: string;
    let wins: string;
    let totalMvp: string;
    let totalSvp: string;

    switch (gameMode) {
        case 'ranked':
            concatedHeroes = data.heroes_ranked;
            kills = data.overall_stats.ranked.total_kills.toString();
            kdaRatio = (
                (data.overall_stats.ranked.total_kills + data.overall_stats.ranked.total_assists)
                / data.overall_stats.ranked.total_deaths
            ).toFixed(1);
            wins = data.overall_stats.ranked.total_wins.toString();
            totalMvp = data.overall_stats.ranked.total_mvp.toString();
            totalSvp = data.overall_stats.ranked.total_svp.toString();
            break;
        case 'casual':
            concatedHeroes = data.heroes_unranked;
            kills = data.overall_stats.unranked.total_kills.toString();
            kdaRatio = (
                (data.overall_stats.unranked.total_kills + data.overall_stats.unranked.total_assists)
                / data.overall_stats.unranked.total_deaths
            ).toFixed(1);
            wins = data.overall_stats.unranked.total_wins.toString();
            totalMvp = data.overall_stats.unranked.total_mvp.toString();
            totalSvp = data.overall_stats.unranked.total_svp.toString();
            break;
        case 'both':
            concatedHeroes = data.heroes_ranked.concat(data.heroes_unranked);
            kills = (data.overall_stats.ranked.total_kills + data.overall_stats.unranked.total_kills).toString();
            kdaRatio = (
                (data.overall_stats.ranked.total_kills + data.overall_stats.unranked.total_kills + data.overall_stats.ranked.total_assists + data.overall_stats.unranked.total_assists)
                / (data.overall_stats.ranked.total_deaths + data.overall_stats.unranked.total_deaths)
            ).toFixed(1);
            wins = (data.overall_stats.ranked.total_wins + data.overall_stats.unranked.total_wins).toString();
            totalMvp = (data.overall_stats.ranked.total_mvp + data.overall_stats.unranked.total_mvp).toString();
            totalSvp = (data.overall_stats.ranked.total_svp + data.overall_stats.unranked.total_svp).toString();
            break;
    }

    let heal = 0;
    let damage = 0;
    let damage_taken = 0;
    let play_time = 0;

    const duelist = {
        wins: 0,
        play_time: 0,
        mvp: 0,
        svp: 0,
        matches: 0,
        kills: 0,
        assists: 0,
        deaths: 0
    };
    const strategist = {
        wins: 0,
        play_time: 0,
        mvp: 0,
        svp: 0,
        matches: 0,
        kills: 0,
        assists: 0,
        deaths: 0
    };
    const vanguard = {
        wins: 0,
        play_time: 0,
        mvp: 0,
        svp: 0,
        matches: 0,
        kills: 0,
        assists: 0,
        deaths: 0
    };

    for (const hero of concatedHeroes) {
        const role = allHeroes.find((x) => Number(x.id) === hero.hero_id)?.role;
        if (!role) {
            continue;
        }

        switch (role) {
            case Role.Duelist:
                duelist.wins += hero.wins;
                duelist.play_time += hero.play_time;
                duelist.mvp += hero.mvp;
                duelist.svp += hero.svp;
                duelist.matches += hero.matches;
                duelist.kills += hero.kills;
                duelist.assists += hero.assists;
                duelist.deaths += hero.deaths;
                damage += hero.damage;
                heal += hero.heal;
                damage_taken += hero.damage_taken;
                play_time += hero.play_time;
                break;
            case Role.Strategist:
                strategist.wins += hero.wins;
                strategist.play_time += hero.play_time;
                strategist.mvp += hero.mvp;
                strategist.svp += hero.svp;
                strategist.matches += hero.matches;
                strategist.kills += hero.kills;
                strategist.assists += hero.assists;
                strategist.deaths += hero.deaths;
                damage += hero.damage;
                heal += hero.heal;
                damage_taken += hero.damage_taken;
                play_time += hero.play_time;
                break;
            case Role.Vanguard:
                vanguard.wins += hero.wins;
                vanguard.play_time += hero.play_time;
                vanguard.mvp += hero.mvp;
                vanguard.svp += hero.svp;
                vanguard.matches += hero.matches;
                vanguard.kills += hero.kills;
                vanguard.assists += hero.assists;
                vanguard.deaths += hero.deaths;
                damage += hero.damage;
                heal += hero.heal;
                damage_taken += hero.damage_taken;
                play_time += hero.play_time;
                break;
        }
    }

    const background = await loadImage(join(process.cwd(), 'assets', 'profile', 'backgroundv2.png'));
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0);

    if (data.player.rank.color && data.player.rank.image) {
        const rankIcon = await loadImage(getRankPath(data.player.rank.rank));
        ctx.drawImage(rankIcon, 1_187, 50, 150, 150);

        ctx.fillStyle = 'white';
        ctx.font = '900 40px RefrigeratorDeluxeBold';
        ctx.fillText(data.player.rank.rank, 1_330, 120);

        const rs = Object.values(data.player.info.rank_game_season).sort((a, b) => b.rank_game_id - a.rank_game_id).at(0)?.rank_score.toLocaleString(undefined, { maximumFractionDigits: 0 });
        if (rs) {
            ctx.fillStyle = '#C1C1C1';
            ctx.font = '900 35px RefrigeratorDeluxeBold';
            ctx.fillText(`RS ${rs}`, 1_330, 160);
        }
    }

    ctx.fillStyle = '#7B7F8A';
    ctx.font = '900 25px RefrigeratorDeluxeBold';
    ctx.fillText(`WR ${vanguard.wins
        ? (vanguard.wins / vanguard.matches * 100).toFixed(1)
        : '0.0'}% | KDA ${vanguard.kills
            ? ((vanguard.kills + vanguard.assists) / vanguard.deaths).toFixed(1)
            : 0}`, 133, 355);

    ctx.fillText(`WR ${strategist.wins
        ? (strategist.wins / strategist.matches * 100).toFixed(1)
        : '0.0'}% | KDA ${strategist.kills
            ? ((strategist.kills + strategist.assists) / strategist.deaths).toFixed(1)
            : 0}`, 133, 435);

    ctx.fillText(`WR ${duelist.wins
        ? (duelist.wins / duelist.matches * 100).toFixed(1)
        : '0.0'}% | KDA ${duelist.kills
            ? ((duelist.kills + duelist.assists) / duelist.deaths).toFixed(1)
            : 0}`, 133, 515);

    ctx.font = '900 23px RefrigeratorDeluxeBold';
    {
      ctx.fillStyle = '#cd773c';
      const damageNumberText = (damage / play_time * 60 || 0).toFixed(0);
      const damageNumberMetrics = ctx.measureText(damageNumberText);
      ctx.fillText(damageNumberText, 110, 647);

      ctx.fillStyle = 'white';
      ctx.fillText('damage dealt', damageNumberMetrics.width + 120, 647);
    }
    {
      ctx.fillStyle = '#80b1b4';
      const damageTakenNumberText = (
        damage_taken / play_time * 60 || 0
      ).toFixed(0);
      const damageTakenNumberMetrics = ctx.measureText(damageTakenNumberText);
      ctx.fillText(damageTakenNumberText, 110, 683);

      ctx.fillStyle = 'white';
      ctx.fillText('damage taken', damageTakenNumberMetrics.width + 120, 683);
    }
    {
      ctx.fillStyle = '#a4ba7a';
      const healNumberText = (heal / play_time * 60 || 0).toFixed(0);
      const healNumberMetrics = ctx.measureText(healNumberText);
      ctx.fillText(healNumberText, 110, 719);

      ctx.fillStyle = 'white';
      ctx.fillText('healing done', healNumberMetrics.width + 120, 719);
    }

    ctx.font = '900 30px RefrigeratorDeluxeBold';
    ctx.fillStyle = '#7B7F8A';
    const killsText = kills.toString();
    const killsMetrics = ctx.measureText(killsText);
    ctx.fillText(killsText, 992 - killsMetrics.width / 2, 325);

    const kdaText = (kdaRatio || 0).toString();
    const kdaMetrics = ctx.measureText(kdaText);
    ctx.fillText(kdaText, 1_112 - kdaMetrics.width / 2, 325);

    const winsText = wins.toString();
    const winsMetrics = ctx.measureText(winsText);
    ctx.fillText(winsText, 1_233 - winsMetrics.width / 2, 325);

    const mvpText = totalMvp.toString();
    const mvpMetrics = ctx.measureText(mvpText);
    ctx.fillText(mvpText, 1_351 - mvpMetrics.width / 2, 325);

    const svpText = totalSvp.toString();
    const svpMetrics = ctx.measureText(svpText);
    ctx.fillText(svpText, 1_471 - svpMetrics.width / 2, 325);

    const userIcon = await loadUserIcon(data.player.icon.player_icon_id);
    drawCircularImage(ctx, userIcon, 60, 40, 150, 150);

    ctx.font = '900 40px RefrigeratorDeluxeBold';
    ctx.fillStyle = 'white';
    ctx.fillText(data.player.name, 228, 110);

    if (data.player.team.club_team_id) {
        const clubTeamName = data.player.team.club_team_mini_name;
        ctx.font = '40px RefrigeratorDeluxeBold';
        ctx.fillStyle = '#737373';
        ctx.fillText(`#${clubTeamName}`, 220 + ctx.measureText(data.player.name).width + 10, 110);
    }

    ctx.font = '900 30px RefrigeratorDeluxeBold';
    ctx.fillStyle = '#7B7F8A';
    ctx.fillText(`Player UID: ${data.player.uid}`, 228, 143);
    const levelBackground = await loadImage(join(process.cwd(), 'assets', 'profile', 'level_bg.png'));

    ctx.drawImage(levelBackground, 111, 174);

    const levelText = data.player.level.toString();
    ctx.fillStyle = 'black';
    ctx.font = '900 20px RefrigeratorDeluxeBold';
    ctx.fillText(levelText, 136 - ctx.measureText(levelText).width / 2, 194);

    ctx.fillStyle = '#7B7F8A';

    const mostplayed = concatedHeroes.toSorted((a, b) => b.play_time - a.play_time).at(0);
    if (mostplayed) {
        const logoUrl = `${STICKY_CDN_DOMAIN}/Content/Marvel_LQ/UI/Textures/Loading/HeroLogo/img_loading_${mostplayed.hero_id}_herologo.png`;
        const logoImage = await loadImage(logoUrl);
        ctx.save();
        roundedRect(ctx, 463, 232, 414, 133, 20);
        ctx.clip();
        ctx.globalAlpha = 0.3;
        drawRotatedImage(ctx, logoImage, 680, 230, 230, 230, -24);
        ctx.globalAlpha = 1;
        const colorUrl = `${STICKY_CDN_DOMAIN}/Content/Marvel/UI/Textures/HeroGallery_V3/HeroDetail/Skill/Dynamic/img_hero_skill_banner_${mostplayed.hero_id}001.png`;
        const { r, g, b } = await getPixelWithCanvas(colorUrl, 100, 100);
        const gradient = ctx.createLinearGradient(600, 232, 600, 232 + 133);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
        gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(400, 232, 477, 133);

        ctx.fillStyle = 'white';
        ctx.font = 'italic 800 50px RefrigeratorDeluxeBold';
        ctx.fillText('Most used hero', 475, 285);

        ctx.font = 'italic 900 50px RefrigeratorDeluxeBold';
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillText(mostplayed.hero_name.toUpperCase(), 475, 348);
        ctx.restore();
    }

    const rawHeroes: Record<number, Mutable<Pick<HeroesRanked, 'hero_thumbnail' | 'hero_name' | 'matches' | 'assists' | 'hero_id' | 'deaths' | 'kills' | 'wins' | 'mvp' | 'svp'>>> = {};

    for (const i of concatedHeroes) {
        if (i.hero_id in rawHeroes) {
            rawHeroes[i.hero_id].matches += i.matches;
            rawHeroes[i.hero_id].assists += i.assists;
            rawHeroes[i.hero_id].deaths += i.deaths;
            rawHeroes[i.hero_id].kills += i.kills;
            rawHeroes[i.hero_id].wins += i.wins;
            rawHeroes[i.hero_id].mvp += i.mvp;
            rawHeroes[i.hero_id].svp += i.svp;
        } else {
            rawHeroes[i.hero_id] = {
                hero_name: i.hero_name,
                matches: i.matches,
                assists: i.assists,
                deaths: i.deaths,
                kills: i.kills,
                wins: i.wins,
                mvp: i.mvp,
                svp: i.svp,
                hero_id: i.hero_id,
                hero_thumbnail: i.hero_thumbnail
            };
        }
    }

    {
        const topHeroes = Object.values(rawHeroes).toSorted((a, b) => b.matches - a.matches).slice(0, 3);
        ctx.font = '900 34px RefrigeratorDeluxeBold';
        for (let i = 0; i < topHeroes.length; i++) {
            const hero = topHeroes.at(i)!;
            const y = 500 + i * 85;
            const heroIcon = await loadHeroSquare(hero.hero_id);

            ctx.drawImage(heroIcon, 490, y, 50, 50);

            const heroNameMetrics = ctx.measureText(hero.hero_name);
            ctx.fillText(hero.hero_name, 550, y + 25 + heroNameMetrics.emHeightAscent / 2);

            const matchesMetrics = ctx.measureText(hero.matches.toString());
            ctx.fillText(hero.matches.toString(), 815 - matchesMetrics.width / 2, y + 35);

            const winPct = `${(hero.wins / hero.matches * 100).toFixed(1)}%`;
            const wrMetrics = ctx.measureText(winPct);
            ctx.fillText(winPct, 990 - wrMetrics.width / 2, y + 35);

            const heroSvpMetrics = ctx.measureText(hero.svp.toString());
            ctx.fillText(hero.svp.toString(), 1_124 - heroSvpMetrics.width / 2, y + 35);

            const heroMvpMetrics = ctx.measureText(hero.mvp.toString());
            ctx.fillText(hero.mvp.toString(), 1_268 - heroMvpMetrics.width / 2, y + 35);

            const heroKdaText = `${(hero.kills / hero.matches).toFixed(0)}/${(hero.deaths / hero.matches).toFixed(0)}/${(hero.assists / hero.matches).toFixed(0)}`;
            const heroKdaMetrics = ctx.measureText(heroKdaText);
            ctx.fillText(heroKdaText, 1_416 - heroKdaMetrics.width / 2, y + 35);
        }
    }


    return canvas.encode('png');
}

export async function generateProfileV1(data: PlayerDTO, allHeroes: HeroesDTO[], gameMode: 'ranked' | 'casual' | 'both' = 'both') {
    let concatedHeroes: HeroesRanked[];
    let kills: string;
    let kdaRatio: string;
    let wins: string;
    let totalMvp: string;
    let totalSvp: string;

    switch (gameMode) {
        case 'ranked':
            concatedHeroes = data.heroes_ranked;
            kills = data.overall_stats.ranked.total_kills.toString();
            kdaRatio = (
                (data.overall_stats.ranked.total_kills + data.overall_stats.ranked.total_assists)
                / data.overall_stats.ranked.total_deaths
            ).toFixed(1);
            wins = data.overall_stats.ranked.total_wins.toString();
            totalMvp = data.overall_stats.ranked.total_mvp.toString();
            totalSvp = data.overall_stats.ranked.total_svp.toString();
            break;
        case 'casual':
            concatedHeroes = data.heroes_unranked;
            kills = data.overall_stats.unranked.total_kills.toString();
            kdaRatio = (
                (data.overall_stats.unranked.total_kills + data.overall_stats.unranked.total_assists)
                / data.overall_stats.unranked.total_deaths
            ).toFixed(1);
            wins = data.overall_stats.unranked.total_wins.toString();
            totalMvp = data.overall_stats.unranked.total_mvp.toString();
            totalSvp = data.overall_stats.unranked.total_svp.toString();
            break;
        case 'both':
            concatedHeroes = data.heroes_ranked.concat(data.heroes_unranked);
            kills = (data.overall_stats.ranked.total_kills + data.overall_stats.unranked.total_kills).toString();
            kdaRatio = (
                (data.overall_stats.ranked.total_kills + data.overall_stats.unranked.total_kills + data.overall_stats.ranked.total_assists + data.overall_stats.unranked.total_assists)
                / (data.overall_stats.ranked.total_deaths + data.overall_stats.unranked.total_deaths)
            ).toFixed(1);
            wins = (data.overall_stats.ranked.total_wins + data.overall_stats.unranked.total_wins).toString();
            totalMvp = (data.overall_stats.ranked.total_mvp + data.overall_stats.unranked.total_mvp).toString();
            totalSvp = (data.overall_stats.ranked.total_svp + data.overall_stats.unranked.total_svp).toString();
            break;
    }
    const mostplayed = concatedHeroes.toSorted((a, b) => b.play_time - a.play_time).at(0);
    const background = await loadImage(join(process.cwd(), 'assets', 'profile', 'background.png'));

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#313338';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mapBackground = await loadImage(join(process.cwd(), 'assets', 'profile', 'profile_map.png'));
    const userIcon = await loadUserIcon(data.player.icon.player_icon_id);
    const levelBackground = await loadImage(join(process.cwd(), 'assets', 'profile', 'level_bg.png'));

    ctx.drawImage(mapBackground, -225, 0);
    if (mostplayed?.hero_id) {
        const heroBackground = await loadImage(join(process.cwd(), 'assets', 'heroes_bg', `${mostplayed.hero_id}.png`));
        ctx.drawImage(heroBackground, 0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(background, 0, 0);
    ctx.drawImage(userIcon, 99, 43, 100, 100);
    if (mostplayed) {
        const heroHistoryImage = await loadHeroHistory(mostplayed.hero_id);
        const histH = 120;
        const histW = 344;
        const histX = 768;
        const histY = 33;

        const heroHistoryCanvas = createCanvas(histW, histH);
        const heroHistoryCtx = heroHistoryCanvas.getContext('2d');

        heroHistoryCtx.drawImage(heroHistoryImage, 0, 0, histW, histH);

        const gradient = heroHistoryCtx.createLinearGradient(0, 0, histW, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

        heroHistoryCtx.globalCompositeOperation = 'destination-in';
        heroHistoryCtx.fillStyle = gradient;
        heroHistoryCtx.fillRect(0, 0, histW, histH);

        ctx.drawImage(heroHistoryCanvas, histX, histY);
    }

    ctx.font = '900 36px RefrigeratorDeluxeBold';
    ctx.fillStyle = 'white';
    const identifierMetrics = ctx.measureText(data.player.name);
    ctx.fillText(data.player.name, 215, 91);

    ctx.drawImage(levelBackground, 225 + identifierMetrics.width, 65);

    ctx.font = '900 20px RefrigeratorDeluxeBold';
    const levelMetrics = ctx.measureText(data.player.level.toString());
    ctx.fillStyle = 'black';
    ctx.fillText(data.player.level.toString(), 249 + identifierMetrics.width - levelMetrics.width / 2, 84);

    ctx.fillStyle = '#A0A0A0';
    ctx.font = '900 13px RefrigeratorDeluxeBold';
    ctx.fillText(data.uid.toString(), 260, 110);

    if (data.player.rank.color && data.player.rank.image) {
        const rankIcon = await loadImage(getRankPath(data.player.rank.rank));
        ctx.drawImage(rankIcon, 652, 23, 120, 120);
        ctx.font = '900 18px RefrigeratorDeluxeBold';
        ctx.fillStyle = data.player.rank.color;
        const rankNameText = data.player.rank.rank.toUpperCase();
        const rankNameMetrics = ctx.measureText(rankNameText);
        ctx.fillText(rankNameText, 711 - rankNameMetrics.width / 2, 138);
    }

    ctx.fillStyle = 'black';
    ctx.font = '900 30px RefrigeratorDeluxeBold';

    const killsMetrics = ctx.measureText(kills);
    ctx.fillText(kills, 425 - killsMetrics.width / 2, 295);

    const kdaRatioMetrics = ctx.measureText(kdaRatio);
    ctx.fillText(kdaRatio, 572 - kdaRatioMetrics.width / 2, 295);

    const winsMetrics = ctx.measureText(wins);
    ctx.fillText(wins, 727 - winsMetrics.width / 2, 295);

    const mvpMetrics = ctx.measureText(totalMvp);
    ctx.fillText(totalMvp, 861 - mvpMetrics.width / 2, 295);

    const svpMetrics = ctx.measureText(totalSvp);
    ctx.fillText(totalSvp, 1_004 - svpMetrics.width / 2, 295);

    let heal = 0;
    let damage = 0;
    let damage_taken = 0;
    let play_time = 0;

    const duelist = {
        wins: 0,
        play_time: 0,
        mvp: 0,
        svp: 0,
        matches: 0,
        kills: 0,
        assists: 0,
        deaths: 0
    };
    const strategist = {
        wins: 0,
        play_time: 0,
        mvp: 0,
        svp: 0,
        matches: 0,
        kills: 0,
        assists: 0,
        deaths: 0
    };
    const vanguard = {
        wins: 0,
        play_time: 0,
        mvp: 0,
        svp: 0,
        matches: 0,
        kills: 0,
        assists: 0,
        deaths: 0
    };

    for (const hero of concatedHeroes) {
        const role = allHeroes.find((x) => Number(x.id) === hero.hero_id)?.role;
        if (!role) {
            continue;
        }

        switch (role) {
            case Role.Duelist:
                duelist.wins += hero.wins;
                duelist.play_time += hero.play_time;
                duelist.mvp += hero.mvp;
                duelist.svp += hero.svp;
                duelist.matches += hero.matches;
                duelist.kills += hero.kills;
                duelist.assists += hero.assists;
                duelist.deaths += hero.deaths;
                damage += hero.damage;
                heal += hero.heal;
                damage_taken += hero.damage_taken;
                play_time += hero.play_time;
                break;
            case Role.Strategist:
                strategist.wins += hero.wins;
                strategist.play_time += hero.play_time;
                strategist.mvp += hero.mvp;
                strategist.svp += hero.svp;
                strategist.matches += hero.matches;
                strategist.kills += hero.kills;
                strategist.assists += hero.assists;
                strategist.deaths += hero.deaths;
                damage += hero.damage;
                heal += hero.heal;
                damage_taken += hero.damage_taken;
                play_time += hero.play_time;
                break;
            case Role.Vanguard:
                vanguard.wins += hero.wins;
                vanguard.play_time += hero.play_time;
                vanguard.mvp += hero.mvp;
                vanguard.svp += hero.svp;
                vanguard.matches += hero.matches;
                vanguard.kills += hero.kills;
                vanguard.assists += hero.assists;
                vanguard.deaths += hero.deaths;
                damage += hero.damage;
                heal += hero.heal;
                damage_taken += hero.damage_taken;
                play_time += hero.play_time;
                break;
        }
    }

    {
        const pct = duelist.wins
            ? (duelist.wins / duelist.matches * 100).toFixed(1)
            : '0.0';
        const kdaTextRatio = duelist.kills || duelist.assists
            ? ((duelist.kills + duelist.assists) / duelist.deaths).toFixed(1)
            : '0.0';

        ctx.fillStyle = 'black';
        ctx.font = '900 20px RefrigeratorDeluxeBold';
        ctx.fillText(`${pct}%`, 180, 277);
        const kdaTextRatioMetrics = ctx.measureText(kdaTextRatio);
        ctx.fillText(kdaTextRatio, 280 - kdaTextRatioMetrics.width / 2, 261);

        ctx.fillStyle = '#818181';
        ctx.font = '900 18px RefrigeratorDeluxeBold';
        const kdaText = `${(duelist.kills
            ? duelist.kills / duelist.matches
            : 0).toFixed(0)}/${(duelist.deaths
                ? duelist.deaths / duelist.matches
                : 0).toFixed(0)}/${(duelist.assists
                    ? duelist.assists / duelist.matches
                    : 0).toFixed(0)}`;
        const kdaTextMetrics = ctx.measureText(kdaTextRatio);
        ctx.fillText(kdaText, 255 - kdaTextMetrics.width / 2, 278);
    }

    {
        const pct = strategist.wins
            ? (strategist.wins / strategist.matches * 100).toFixed(1)
            : '0.0';
        const kdaTextRatio = strategist.kills || strategist.assists
            ? ((strategist.kills + strategist.assists) / strategist.deaths).toFixed(1)
            : '0.0';

        ctx.fillStyle = 'black';
        ctx.font = '900 20px RefrigeratorDeluxeBold';
        ctx.fillText(`${pct}%`, 180, 343);
        const kdaTextRatioMetrics = ctx.measureText(kdaTextRatio);
        ctx.fillText(kdaTextRatio, 280 - kdaTextRatioMetrics.width / 2, 327);

        ctx.fillStyle = '#818181';
        ctx.font = '900 18px RefrigeratorDeluxeBold';
        const kdaText = `${(strategist.kills
            ? strategist.kills / strategist.matches
            : 0).toFixed(0)}/${(strategist.deaths
                ? strategist.deaths / strategist.matches
                : 0).toFixed(0)}/${(strategist.assists
                    ? strategist.assists / strategist.matches
                    : 0).toFixed(0)}`;
        const kdaTextMetrics = ctx.measureText(kdaTextRatio);
        ctx.fillText(kdaText, 255 - kdaTextMetrics.width / 2, 345);
    }

    {
        const pct = vanguard.wins
            ? (vanguard.wins / vanguard.matches * 100).toFixed(1)
            : '0.0';
        const kdaTextRatio = vanguard.kills || vanguard.assists
            ? ((vanguard.kills + vanguard.assists) / vanguard.deaths).toFixed(1)
            : '0.0';

        ctx.fillStyle = 'black';
        ctx.font = '900 20px RefrigeratorDeluxeBold';
        ctx.fillText(`${pct}%`, 180, 409);
        const kdaTextRatioMetrics = ctx.measureText(kdaTextRatio);
        ctx.fillText(kdaTextRatio, 280 - kdaTextRatioMetrics.width / 2, 393);

        ctx.fillStyle = '#818181';
        ctx.font = '900 18px RefrigeratorDeluxeBold';
        const kdaText = `${(vanguard.kills
            ? vanguard.kills / vanguard.matches
            : 0).toFixed(0)}/${(vanguard.deaths
                ? vanguard.deaths / vanguard.matches
                : 0).toFixed(0)}/${(vanguard.assists
                    ? vanguard.assists / vanguard.matches
                    : 0).toFixed(0)}`;
        const kdaTextMetrics = ctx.measureText(kdaTextRatio);
        ctx.fillText(kdaText, 255 - kdaTextMetrics.width / 2, 410);
    }

    {
        const damagePerMinute = (damage / play_time * 60).toFixed(0);
        ctx.fillStyle = 'black';
        ctx.font = '900 25px RefrigeratorDeluxeBold';
        const damageMetrics = ctx.measureText(damagePerMinute);
        ctx.fillText(damagePerMinute, 150 - damageMetrics.width / 2, 575);
    }

    {
        const healPerMinute = (heal / play_time * 60).toFixed(0);
        ctx.font = '900 25px RefrigeratorDeluxeBold';
        const healingMetrics = ctx.measureText(healPerMinute);
        ctx.fillText(healPerMinute, 247 - healingMetrics.width / 2, 575);
    }

    {
        const damageTakenPerMinute = (damage_taken / play_time * 60).toFixed(0);
        ctx.font = '900 25px RefrigeratorDeluxeBold';
        const damageTakenMetrics = ctx.measureText(damageTakenPerMinute);
        ctx.fillText(damageTakenPerMinute, 195 - damageTakenMetrics.width / 2, 632);
    }

    const rawHeroes: Record<number, Mutable<Pick<HeroesRanked, 'hero_thumbnail' | 'matches' | 'assists' | 'hero_id' | 'deaths' | 'kills' | 'wins' | 'mvp' | 'svp'>>> = {};

    for (const i of concatedHeroes) {
        if (i.hero_id in rawHeroes) {
            rawHeroes[i.hero_id].matches += i.matches;
            rawHeroes[i.hero_id].assists += i.assists;
            rawHeroes[i.hero_id].deaths += i.deaths;
            rawHeroes[i.hero_id].kills += i.kills;
            rawHeroes[i.hero_id].wins += i.wins;
            rawHeroes[i.hero_id].mvp += i.mvp;
            rawHeroes[i.hero_id].svp += i.svp;
        } else {
            rawHeroes[i.hero_id] = {
                matches: i.matches,
                assists: i.assists,
                deaths: i.deaths,
                kills: i.kills,
                wins: i.wins,
                mvp: i.mvp,
                svp: i.svp,
                hero_id: i.hero_id,
                hero_thumbnail: i.hero_thumbnail
            };
        }
    }

    const topHeroes = Object.values(rawHeroes).toSorted((a, b) => b.matches - a.matches).slice(0, 3);

    for (let i = 0; i < topHeroes.length; i++) {
        const hero = topHeroes.at(i)!;
        const y = 432 + i * 61;
        const heroIcon = await loadHeroSquare(hero.hero_id);

        ctx.drawImage(heroIcon, 370, y, 50, 50);
        // ctx.fillStyle = hero.metadata.color;

        const matchesMetrics = ctx.measureText(hero.matches.toString());
        ctx.fillText(hero.matches.toString(), 490 - matchesMetrics.width / 2, y + 35);

        const winPct = `${hero.wins
            ? (hero.wins / hero.matches * 100).toFixed(1)
            : '0.0'}%`;
        const wrMetrics = ctx.measureText(winPct);
        ctx.fillText(winPct, 637 - wrMetrics.width / 2, y + 35);

        const heroMvpMetrics = ctx.measureText(hero.mvp.toString());
        ctx.fillText(hero.mvp.toString(), 763 - heroMvpMetrics.width / 2, y + 35);

        const heroSvpMetrics = ctx.measureText(hero.svp.toString());
        ctx.fillText(hero.svp.toString(), 902 - heroSvpMetrics.width / 2, y + 35);

        const kdaText = `${hero.matches
            ? (hero.kills / hero.matches).toFixed(0)
            : '0'}/${hero.matches
                ? (hero.deaths / hero.matches).toFixed(0)
                : '0'}/${hero.matches
                    ? (hero.assists / hero.matches).toFixed(0)
                    : '0'}`;
        const kdaMetrics = ctx.measureText(kdaText);
        ctx.fillText(kdaText, 1_040 - kdaMetrics.width / 2, y + 35);
    }

    return canvas.encode('png');
}

import type { CommandContext } from 'seyfert';
import type { Image } from '@napi-rs/canvas';

import { loadImage, Canvas } from '@napi-rs/canvas';
import { join } from 'node:path';

import type { MatchHistoryDTO } from '../../types/dtos/MatchHistoryDTO';
import type { PlayerDTO } from '../../types/dtos/PlayerDTO';

import { loadHeroSquare, loadRankIcon, loadUserIcon } from './_';
import { getRankDetails } from '../functions/rank-utils';
import { getMapById } from '../functions/maps';
import { drawCircularImage } from './utils';
import { STICKY_CDN_DOMAIN } from '../env';
import { Seasons } from '../constants';

const gameModes = [{
    name: 'All',
    value: 0
}, {
    name: 'Quick Play',
    value: 1
}, {
    name: 'Competitive',
    value: 2
}, {
    name: 'Custom',
    value: 3
}, {
    name: 'Tournament',
    value: 9
}, {
    name: 'Vs AI',
    value: 7
}] as const;

function getSeasonName(season?: number): typeof Seasons[number]['name'] {
    if (season === undefined) {
        return Seasons[Seasons.length - 1].name;
    }
    const seasonData = Seasons.find((s) => s.value === season) ?? Seasons[Seasons.length - 1];
    return seasonData.name;
}

function getGameModeName(gameMode?: number): typeof gameModes[number]['name'] {
    if (gameMode === undefined) {
        return gameModes[gameModes.length - 1].name;
    }
    const gameModeData = gameModes.find((g) => g.value === gameMode) ?? gameModes[gameModes.length - 1];
    return gameModeData.name;
}

const WIDTH = 1_495;
const HEIGHT = 958;
let background: Image | null = null;
let levelBackground: Image | null = null;

export async function createMatchHistoryImage(t: CommandContext['t'], user: PlayerDTO, matchHistory: MatchHistoryDTO['match_history'], season?: number, gameMode?: number): Promise<Buffer> {
    const canvas = new Canvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    background ??= await loadImage(await Bun.file(join(process.cwd(), 'assets', 'match-history', 'background.png')).bytes());
    ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

    const playerIcon = await loadUserIcon(user.player.icon.player_icon_id);
    drawCircularImage(ctx, playerIcon, 60, 60, 150, 150);
    levelBackground ??= await loadImage(join(process.cwd(), 'assets', 'profile', 'level_bg.png'));
    ctx.drawImage(levelBackground, 95, 180, 80, 30);

    ctx.font = '22px InterBlack';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const playerLevel = user.player.level.toString();
    ctx.fillText(playerLevel, 95 + 80 / 2, 180 + 30 / 2);

    ctx.font = '40px InterBlack';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const playerName = user.player.name;
    ctx.fillText(playerName, 220, 100 + 40 / 2);

    if (user.player.team.club_team_id) {
        const clubTeamName = user.player.team.club_team_mini_name;
        ctx.font = '40px InterBlack';
        ctx.fillStyle = '#737373';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${clubTeamName}`, 220 + ctx.measureText(playerName).width + 10, 100 + 40 / 2);
    }

    ctx.font = '20px InterBlack';
    ctx.fillStyle = '#737373';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const playerUID = user.player.uid;
    ctx.fillText(`Player UID: ${playerUID}`, 220, 100 + 40 + 20 / 2);

    if (user.player.rank.rank !== 'Invalid level' && matchHistory.filter((m) => m.game_mode_id === 2).length > 0) {
        const rankedGames = matchHistory.filter((m) => m.game_mode_id === 2);
        const lastRankedGame = rankedGames[0];
        const RANK_ICON_SIZE = 150;
        const RIGHT_MARGIN = 60;

        const { rank, tier } = getRankDetails(lastRankedGame.match_player.score_info.new_level ?? 0);
        const rankName = `${rank} ${tier}`;

        ctx.font = '40px InterBlack';
        const rankNameMetrics = ctx.measureText(rankName);
        const rankNameWidth = rankNameMetrics.width;

        const rankNameX = WIDTH - RIGHT_MARGIN;
        const rankIconX = rankNameX - rankNameWidth - RANK_ICON_SIZE;

        const rankIcon = await loadRankIcon(lastRankedGame.match_player.score_info.new_level ?? 0);
        ctx.drawImage(rankIcon, rankIconX, 60, RANK_ICON_SIZE, RANK_ICON_SIZE);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const rankNameY = 60 + RANK_ICON_SIZE / 2 - rankNameMetrics.actualBoundingBoxAscent / 2;
        ctx.fillText(rankName, rankNameX, rankNameY);

        ctx.font = '20px InterBlack';
        ctx.fillStyle = '#737373';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const rankPoint = lastRankedGame.match_player.score_info.new_score ?? 0;
        ctx.fillText(`${rankPoint.toFixed(0)} RS`, rankNameX, 60 + RANK_ICON_SIZE / 2 + rankNameMetrics.actualBoundingBoxAscent / 2 + 25 / 2);
    }

    ctx.font = '24px InterSemiBold';
    ctx.fillStyle = '#737373';
    ctx.textAlign = 'left';
    const seasonTitle = getSeasonName(season);
    const seasonMetrics = ctx.measureText(seasonTitle);
    ctx.fillText(seasonTitle, 60, 230 + seasonMetrics.emHeightAscent);

    if (gameMode !== undefined) {
        const gameModeTitle = `- ${getGameModeName(gameMode)}`;
        const gameModeMetrics = ctx.measureText(gameModeTitle);
        ctx.fillText(gameModeTitle, 45 + seasonMetrics.width + 20, 230 + gameModeMetrics.emHeightAscent);
    }

    const MARGIN = {
        top: 268,
        left: 60,
        right: 60,
        bottom: 60
    };

    const MATCH_RECT_WIDTH = 1_375;
    const MATCH_RECT_HEIGHT = 110;
    const MATCH_RECT_RADIUS = 15;
    const MATCH_SPACING = 20;
    const GRADIENT_WIDTH = 220;
    const STATUS_TEXT_MARGIN = 30;

    const matchesToDisplay = matchHistory.slice(0, 5);

    for (let i = 0; i < matchesToDisplay.length; i++) {
        const match = matchesToDisplay[i];
        const matchResult = match.match_player.is_win.score;
        const isWin = matchResult === 1;
        const isDraw = matchResult === 2;
        const isDisconnected = match.match_player.disconnected;
        const rectY = MARGIN.top + i * (MATCH_RECT_HEIGHT + MATCH_SPACING);


        ctx.beginPath();
        ctx.moveTo(MARGIN.left + MATCH_RECT_RADIUS, rectY);
        ctx.lineTo(MARGIN.left + MATCH_RECT_WIDTH - MATCH_RECT_RADIUS, rectY);
        ctx.arcTo(MARGIN.left + MATCH_RECT_WIDTH, rectY, MARGIN.left + MATCH_RECT_WIDTH, rectY + MATCH_RECT_RADIUS, MATCH_RECT_RADIUS);
        ctx.lineTo(MARGIN.left + MATCH_RECT_WIDTH, rectY + MATCH_RECT_HEIGHT - MATCH_RECT_RADIUS);
        ctx.arcTo(MARGIN.left + MATCH_RECT_WIDTH, rectY + MATCH_RECT_HEIGHT, MARGIN.left + MATCH_RECT_WIDTH - MATCH_RECT_RADIUS, rectY + MATCH_RECT_HEIGHT, MATCH_RECT_RADIUS);
        ctx.lineTo(MARGIN.left + MATCH_RECT_RADIUS, rectY + MATCH_RECT_HEIGHT);
        ctx.arcTo(MARGIN.left, rectY + MATCH_RECT_HEIGHT, MARGIN.left, rectY + MATCH_RECT_HEIGHT - MATCH_RECT_RADIUS, MATCH_RECT_RADIUS);
        ctx.lineTo(MARGIN.left, rectY + MATCH_RECT_RADIUS);
        ctx.arcTo(MARGIN.left, rectY, MARGIN.left + MATCH_RECT_RADIUS, rectY, MATCH_RECT_RADIUS);
        ctx.closePath();

        ctx.fillStyle = '#1B1D23';
        ctx.fill();

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(MARGIN.left + MATCH_RECT_RADIUS, rectY);
        ctx.lineTo(MARGIN.left + GRADIENT_WIDTH, rectY);
        ctx.lineTo(MARGIN.left + GRADIENT_WIDTH, rectY + MATCH_RECT_HEIGHT);
        ctx.lineTo(MARGIN.left + MATCH_RECT_RADIUS, rectY + MATCH_RECT_HEIGHT);
        ctx.arcTo(MARGIN.left, rectY + MATCH_RECT_HEIGHT, MARGIN.left, rectY + MATCH_RECT_HEIGHT - MATCH_RECT_RADIUS, MATCH_RECT_RADIUS);
        ctx.lineTo(MARGIN.left, rectY + MATCH_RECT_RADIUS);
        ctx.arcTo(MARGIN.left, rectY, MARGIN.left + MATCH_RECT_RADIUS, rectY, MATCH_RECT_RADIUS);
        ctx.closePath();
        ctx.clip();

        const gradient = ctx.createLinearGradient(MARGIN.left, 0, MARGIN.left + GRADIENT_WIDTH, 0);
        if (isDisconnected) {
            gradient.addColorStop(0, 'rgba(128, 128, 128, 0.5)');
            gradient.addColorStop(0.4, 'rgba(128, 128, 128, 0.3)');
            gradient.addColorStop(0.8, 'rgba(128, 128, 128, 0.1)');
            gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
        } else if (isWin) {
            gradient.addColorStop(0, 'rgba(46, 213, 115, 0.5)');
            gradient.addColorStop(0.4, 'rgba(46, 213, 115, 0.3)');
            gradient.addColorStop(0.8, 'rgba(46, 213, 115, 0.1)');
            gradient.addColorStop(1, 'rgba(46, 213, 115, 0)');
        } else if (isDraw) {
            gradient.addColorStop(0, 'rgba(255, 190, 11, 0.5)');
            gradient.addColorStop(0.4, 'rgba(255, 190, 11, 0.3)');
            gradient.addColorStop(0.8, 'rgba(255, 190, 11, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 190, 11, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(243, 69, 85, 0.5)');
            gradient.addColorStop(0.4, 'rgba(243, 69, 85, 0.3)');
            gradient.addColorStop(0.8, 'rgba(243, 69, 85, 0.1)');
            gradient.addColorStop(1, 'rgba(243, 69, 85, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(MARGIN.left, rectY, GRADIENT_WIDTH, MATCH_RECT_HEIGHT);

        ctx.restore();

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(MARGIN.left + MATCH_RECT_WIDTH - GRADIENT_WIDTH, rectY);
        ctx.lineTo(MARGIN.left + MATCH_RECT_WIDTH - MATCH_RECT_RADIUS, rectY);
        ctx.arcTo(MARGIN.left + MATCH_RECT_WIDTH, rectY, MARGIN.left + MATCH_RECT_WIDTH, rectY + MATCH_RECT_RADIUS, MATCH_RECT_RADIUS);
        ctx.lineTo(MARGIN.left + MATCH_RECT_WIDTH, rectY + MATCH_RECT_HEIGHT - MATCH_RECT_RADIUS);
        ctx.arcTo(MARGIN.left + MATCH_RECT_WIDTH, rectY + MATCH_RECT_HEIGHT, MARGIN.left + MATCH_RECT_WIDTH - MATCH_RECT_RADIUS, rectY + MATCH_RECT_HEIGHT, MATCH_RECT_RADIUS);
        ctx.lineTo(MARGIN.left + MATCH_RECT_WIDTH - GRADIENT_WIDTH, rectY + MATCH_RECT_HEIGHT);
        ctx.closePath();
        ctx.clip();

        const mapUrl = `${STICKY_CDN_DOMAIN}/maps/${match.match_map_id}/large.png`;
        const mapImage = await loadImage(mapUrl).catch(() => null);

        if (mapImage) {
            const aspectRatio = mapImage.width / mapImage.height;
            const height = MATCH_RECT_HEIGHT;
            const width = height * aspectRatio;
            const xPos = MARGIN.left + MATCH_RECT_WIDTH - width;

            ctx.drawImage(mapImage, xPos, rectY, width, height);

            const imageGradient = ctx.createLinearGradient(
                MARGIN.left + MATCH_RECT_WIDTH - GRADIENT_WIDTH, 0, MARGIN.left + MATCH_RECT_WIDTH - GRADIENT_WIDTH / 4, 0
            );

            imageGradient.addColorStop(0, 'rgba(27, 29, 35, 1)');
            imageGradient.addColorStop(0.2, 'rgba(27, 29, 35, 0.90)');
            imageGradient.addColorStop(0.5, 'rgba(27, 29, 35, 0.75)');
            imageGradient.addColorStop(0.7, 'rgba(27, 29, 35, 0.50)');
            imageGradient.addColorStop(0.9, 'rgba(27, 29, 35, 0.25)');
            imageGradient.addColorStop(1, 'rgba(27, 29, 35, 0)');

            ctx.fillStyle = imageGradient;
            ctx.fillRect(MARGIN.left + MATCH_RECT_WIDTH - GRADIENT_WIDTH, rectY, GRADIENT_WIDTH, MATCH_RECT_HEIGHT);
        }

        ctx.restore();


        const TEXT_VERTICAL_SPACING = 24;
        const centerY = rectY + MATCH_RECT_HEIGHT / 2;

        ctx.font = '32px InterBlack';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const gameModeText = getMapById(match.match_map_id)?.game_mode ?? 'Unknown Game Mode';
        ctx.fillText(gameModeText, MARGIN.left + STATUS_TEXT_MARGIN, centerY);

        const gameDate = new Date(match.match_time_stamp * 1_000);
        const formattedDate = t.common.date(gameDate.getDate().toString().padStart(2, '0'), (gameDate.getMonth() + 1).toString().padStart(2, '0'), gameDate.getFullYear()).get();
        ctx.font = '20px InterSemiBold';
        ctx.fillStyle = '#A6A6A6';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const gameModeName = `${getGameModeName(match.game_mode_id)} // ${formattedDate}`;
        ctx.fillText(gameModeName, MARGIN.left + STATUS_TEXT_MARGIN, centerY - TEXT_VERTICAL_SPACING);

        ctx.font = '20px InterSemiBold';
        ctx.fillStyle = '#A6A6A6';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const mapName = getMapById(match.match_map_id)?.name ?? 'Unknown Map';
        ctx.fillText(mapName, MARGIN.left + STATUS_TEXT_MARGIN, centerY + TEXT_VERTICAL_SPACING * 1.15);

        const hero = match.match_player.player_hero;
        if (hero.hero_id) {
            const HERO_ICON_SIZE = 80;
            const HERO_ICON_MARGIN_LEFT = 300;
            const HERO_BORDER_RADIUS = 15;

            const heroIcon = await loadHeroSquare(hero.hero_id);

            ctx.save();

            ctx.beginPath();
            ctx.moveTo(MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_BORDER_RADIUS, centerY - HERO_ICON_SIZE / 2);
            ctx.lineTo(MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_ICON_SIZE - HERO_BORDER_RADIUS, centerY - HERO_ICON_SIZE / 2);
            ctx.arcTo(
                MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_ICON_SIZE, centerY - HERO_ICON_SIZE / 2, MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_ICON_SIZE, centerY - HERO_ICON_SIZE / 2 + HERO_BORDER_RADIUS, HERO_BORDER_RADIUS
            );
            ctx.lineTo(MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_ICON_SIZE, centerY + HERO_ICON_SIZE / 2 - HERO_BORDER_RADIUS);
            ctx.arcTo(
                MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_ICON_SIZE, centerY + HERO_ICON_SIZE / 2, MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_ICON_SIZE - HERO_BORDER_RADIUS, centerY + HERO_ICON_SIZE / 2, HERO_BORDER_RADIUS
            );
            ctx.lineTo(MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_BORDER_RADIUS, centerY + HERO_ICON_SIZE / 2);
            ctx.arcTo(
                MARGIN.left + HERO_ICON_MARGIN_LEFT, centerY + HERO_ICON_SIZE / 2, MARGIN.left + HERO_ICON_MARGIN_LEFT, centerY + HERO_ICON_SIZE / 2 - HERO_BORDER_RADIUS, HERO_BORDER_RADIUS
            );
            ctx.lineTo(MARGIN.left + HERO_ICON_MARGIN_LEFT, centerY - HERO_ICON_SIZE / 2 + HERO_BORDER_RADIUS);
            ctx.arcTo(
                MARGIN.left + HERO_ICON_MARGIN_LEFT, centerY - HERO_ICON_SIZE / 2, MARGIN.left + HERO_ICON_MARGIN_LEFT + HERO_BORDER_RADIUS, centerY - HERO_ICON_SIZE / 2, HERO_BORDER_RADIUS
            );
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(
                heroIcon,
                MARGIN.left + HERO_ICON_MARGIN_LEFT,
                centerY - HERO_ICON_SIZE / 2,
                HERO_ICON_SIZE,
                HERO_ICON_SIZE
            );

            ctx.restore();
        }

        if (match.game_mode_id === 2 && match.match_player.score_info.add_score !== null) {
            const addScore = match.match_player.score_info.add_score;
            const newScore = match.match_player.score_info.new_score ?? 0;
            const isPositive = addScore > 0;

            const centerX = MARGIN.left + MATCH_RECT_WIDTH / 2;

            const RANK_DISPLAY_WIDTH = 200;
            const NEW_RANK_ICON_SIZE = 50;

            const { rank: newRank, tier: newTier, color: newColor } = getRankDetails(match.match_player.score_info.new_level ?? 0);
            const rankIconPerMatch = await loadRankIcon(match.match_player.score_info.new_level ?? 0);

            ctx.drawImage(
                rankIconPerMatch,
                centerX - RANK_DISPLAY_WIDTH / 2,
                centerY - NEW_RANK_ICON_SIZE / 2,
                NEW_RANK_ICON_SIZE,
                NEW_RANK_ICON_SIZE
            );

            ctx.font = 'bold 22px InterBlack';
            ctx.fillStyle = newColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            const rankTitle = `${newRank} ${newTier}`;
            const rankTitleWidth = ctx.measureText(rankTitle).width;

            ctx.fillText(
                rankTitle,
                centerX - RANK_DISPLAY_WIDTH / 2 + NEW_RANK_ICON_SIZE + 10,
                centerY - NEW_RANK_ICON_SIZE / 3
            );

            ctx.font = 'bold 18px InterBlack';
            ctx.fillStyle = 'white';
            ctx.textBaseline = 'bottom';
            const formattedScore = Math.floor(newScore).toLocaleString();
            ctx.fillText(
                formattedScore,
                centerX - RANK_DISPLAY_WIDTH / 2 + NEW_RANK_ICON_SIZE + 10,
                centerY + NEW_RANK_ICON_SIZE / 3 + 5
            );

            ctx.font = '18px InterBlack';
            ctx.fillStyle = '#A6A6A6';
            ctx.textBaseline = 'bottom';
            const scoreWidth = ctx.measureText(formattedScore).width;
            ctx.fillText(
                'RS',
                centerX - RANK_DISPLAY_WIDTH / 2 + NEW_RANK_ICON_SIZE + 10 + scoreWidth + 5,
                centerY + NEW_RANK_ICON_SIZE / 3 + 5
            );

            const rsWidth = ctx.measureText('RS').width;

            if (addScore !== 0) {
                const pointsChangeText = isPositive
                    ? `+${Math.round(addScore)}`
                    : `${Math.round(addScore)}`;
                const pointsChangeMetrics = ctx.measureText(pointsChangeText);
                const pointsChangeWidth = pointsChangeMetrics.width + 16;
                const pointsChangeHeight = 24;
                const pointsChangeRadius = 4;

                const basePointsX = centerX - RANK_DISPLAY_WIDTH / 2 + NEW_RANK_ICON_SIZE + 10;
                const rankTitleEndX = basePointsX + Math.max(rankTitleWidth, scoreWidth + rsWidth + 15);

                const pointsChangeX = rankTitleEndX + 15;
                const pointsChangeY = centerY + 5;

                ctx.beginPath();
                ctx.roundRect(
                    pointsChangeX,
                    pointsChangeY - pointsChangeHeight / 2,
                    pointsChangeWidth,
                    pointsChangeHeight,
                    pointsChangeRadius
                );

                ctx.fillStyle = isPositive
                    ? '#2ED573'
                    : '#F34555';

                if (addScore === 0) {
                    ctx.fillStyle = '#FFBE0B';
                }

                ctx.fill();

                ctx.font = 'bold 16px InterSemiBold';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pointsChangeText, pointsChangeX + pointsChangeWidth / 2, pointsChangeY);

                if (isDisconnected) {
                    ctx.font = 'bold 13px InterSemiBold';
                    ctx.fillStyle = '#737373';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText('(Disconnect)', pointsChangeX + pointsChangeWidth / 2, pointsChangeY + pointsChangeHeight / 2 + 5);
                }
            }
        }

        const KDA_SECTION_WIDTH = 320;
        const KDA_RIGHT_MARGIN = 160;
        const KDA_POSITION_X = MARGIN.left + MATCH_RECT_WIDTH - KDA_RIGHT_MARGIN - KDA_SECTION_WIDTH;

        const kills = match.match_player.kills;
        const deaths = match.match_player.deaths;
        const assists = match.match_player.assists;
        const kda = deaths === 0 ?
            ((kills + assists) / 1).toFixed(2) :
            ((kills + assists) / deaths).toFixed(2);

        ctx.font = '20px InterSemiBold';
        ctx.fillStyle = '#737373';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const statSpacing = KDA_SECTION_WIDTH / 4;

        const killsX = KDA_POSITION_X + statSpacing * 0.5;
        const deathsX = KDA_POSITION_X + statSpacing * 1.5;
        const assistsX = KDA_POSITION_X + statSpacing * 2.5;
        const kdaX = KDA_POSITION_X + statSpacing * 3.5;

        ctx.fillText('Kills', killsX, centerY - TEXT_VERTICAL_SPACING * 0.8);
        ctx.fillText('Deaths', deathsX, centerY - TEXT_VERTICAL_SPACING * 0.8);
        ctx.fillText('Assists', assistsX, centerY - TEXT_VERTICAL_SPACING * 0.8);
        ctx.fillText('KDA', kdaX, centerY - TEXT_VERTICAL_SPACING * 0.8);

        ctx.font = '24px InterBlack';
        ctx.fillStyle = 'white';
        ctx.fillText(kills.toString(), killsX, centerY + TEXT_VERTICAL_SPACING * 0.5);
        ctx.fillText(deaths.toString(), deathsX, centerY + TEXT_VERTICAL_SPACING * 0.5);
        ctx.fillText(assists.toString(), assistsX, centerY + TEXT_VERTICAL_SPACING * 0.5);

        ctx.font = '24px InterBlack';
        ctx.fillStyle = '#25CCE8';
        ctx.fillText(kda, kdaX, centerY + TEXT_VERTICAL_SPACING * 0.5);

        if (user.uid === match.svp_uid) {
            const url = `${STICKY_CDN_DOMAIN}/Content/L10N/EN/Marvel_LQ/UI/Textures/Settlement/img_settlement_smallsvp.png`;
            const image = await loadImage(url);
            ctx.drawImage(image, 500, rectY + image.height * 0.88);
        }

        if (user.uid === match.mvp_uid) {
            const url = `${STICKY_CDN_DOMAIN}/Content/L10N/EN/Marvel_LQ/UI/Textures/Settlement/img_settlement_smallmvp.png`;
            const image = await loadImage(url);
            ctx.drawImage(image, 500, rectY + image.height * 0.88);
        }
    }

    return canvas.encode('png');
}

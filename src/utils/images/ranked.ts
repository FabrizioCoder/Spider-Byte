import type { MakeRequired } from 'seyfert/lib/common';

import { loadImage, Canvas } from '@napi-rs/canvas';
import { join } from 'node:path';

import type { ScoreInfo } from '../../types/dtos/MatchHistoryDTO';
import type { PlayerDTO } from '../../types/dtos/PlayerDTO';

import { getRankDetails } from '../functions/rank-utils';
import { loadRankIcon, loadUserIcon } from './_';
import { drawCircularImage } from './utils';
import { Seasons } from '../constants';

export interface ExpectedScoreInfo extends MakeRequired<ScoreInfo> {
    match_time_stamp: number;
}



function getSeasonName(season?: number): typeof Seasons[number]['name'] {
    if (season === undefined) {
        return Seasons[Seasons.length - 1].name;
    }
    const seasonData = Seasons.find((s) => s.value === season) ?? Seasons[Seasons.length - 1];
    return seasonData.name;
}

export async function generateRankChart(user: PlayerDTO, scoreInfo: ExpectedScoreInfo[], season?: number): Promise<Buffer> {
    scoreInfo = scoreInfo.toReversed();
    const WIDTH = 1_637;
    const HEIGHT = 803;
    const canvas = new Canvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    const MARGIN = {
        top: 330,
        right: 63,
        bottom: 60,
        left: 130
    };
    const chartWidth = 1_400;
    const chartHeight = 360;
    const lastPoint = scoreInfo[scoreInfo.length - 1];

    // Process data
    const dates = scoreInfo.map((d) => new Date(d.match_time_stamp));
    const scores = scoreInfo.map((d) => d.new_score);
    const maxY = Math.max(1, dates.length - 1);
    const xScale = (index: number) => MARGIN.left + index / maxY * chartWidth;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore;
    const yScale = (score: number) => {
        if (scoreRange === 0) {
            const buffer = chartHeight * 0.25;
            return MARGIN.top + buffer + (chartHeight - buffer * 2) / 2;
        }
        return MARGIN.top + chartHeight - (score - minScore) / scoreRange * chartHeight;
    };

    // Draw background
    const background = await loadImage(await Bun.file(join(process.cwd(), 'assets', 'rank', 'background.png')).bytes());
    ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

    // Chart title in top right
    ctx.font = '900 40px InterBold';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    const chartTitle = 'Ranked Score Chart';
    const titleMetrics = ctx.measureText(chartTitle);
    ctx.fillText(chartTitle, WIDTH - 60, 70 + titleMetrics.emHeightAscent);

    // Season subtitle
    ctx.font = '900 24px InterSemiBold';
    ctx.fillStyle = '#737373';
    ctx.textAlign = 'left';
    const seasonTitle = getSeasonName(season);
    const seasonMetrics = ctx.measureText(seasonTitle);
    ctx.fillText(seasonTitle, 60, 230 + seasonMetrics.emHeightAscent);

    // Add trend statistics
    const initialScore = scoreInfo[0].new_score;
    const finalScore = lastPoint.new_score;
    const scoreDiff = finalScore - initialScore;
    const scoreDiffText = scoreDiff >= 0
        ? `+${Math.round(scoreDiff)}`
        : `${Math.round(scoreDiff)}`;
    const trendText = `Score trend: ${scoreDiffText} points`;

    ctx.font = '700 22px InterSemiBold';
    ctx.fillStyle = scoreDiff >= 0
        ? '#4CAF50'
        : '#F44336';
    ctx.textAlign = 'right';
    ctx.fillText(trendText, WIDTH - 60, 70 + titleMetrics.emHeightAscent + seasonMetrics.emHeightAscent + 45);

    // Calculate win/loss stats
    const totalMatches = scoreInfo.length - 1;
    let wins = 0;
    let losses = 0;

    for (let i = 1; i < scoreInfo.length; i++) {
        const matchScoreDiff = scoreInfo[i].new_score - scoreInfo[i - 1].new_score;
        if (matchScoreDiff > 0) {
            wins++;
        } else if (matchScoreDiff < 0) {
            losses++;
        }
    }

    // Display match statistics
    const matchStatsText = `Matches: ${totalMatches} (${wins}W / ${losses}L)`;
    const winRate = totalMatches > 0
        ? Math.round(wins / totalMatches * 100)
        : 0;
    const winRateText = `Win rate: ${winRate}%`;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(matchStatsText, WIDTH - 60, 70 + titleMetrics.emHeightAscent + seasonMetrics.emHeightAscent + 80);

    ctx.fillStyle = winRate >= 50
        ? '#4CAF50'
        : '#F44336';
    ctx.fillText(winRateText, WIDTH - 60, 70 + titleMetrics.emHeightAscent + seasonMetrics.emHeightAscent + 110);

    ctx.textAlign = 'left';

    // Player info section
    const userIcon = await loadUserIcon(user.player.icon.player_icon_id);
    drawCircularImage(ctx, userIcon, 60, 60, 150, 150);
    const levelBackground = await loadImage(join(process.cwd(), 'assets', 'profile', 'level_bg.png'));
    ctx.drawImage(levelBackground, 95, 180, 80, 30);

    // Player name
    ctx.font = '900 34px InterBold';
    ctx.fillStyle = 'white';
    const playerNameMetrics = ctx.measureText(user.player.name);
    ctx.fillText(user.player.name, 220, 106 + playerNameMetrics.emHeightAscent);

    // Team name if exists
    if (user.player.team.club_team_id) {
        ctx.fillStyle = '#737373';
        const clubTeamName = `#${user.player.team.club_team_mini_name}`;
        const teamIdMetrics = ctx.measureText(clubTeamName);
        ctx.fillText(clubTeamName, 220 + playerNameMetrics.width + 10, 106 + teamIdMetrics.emHeightAscent);
    }

    // Player UID
    ctx.font = '900 20px InterBold';
    ctx.fillStyle = '#737373';
    const uid = `Player UID: ${user.player.uid}`;
    const idMetrics = ctx.measureText(uid);
    ctx.fillText(uid, 217, 106 + playerNameMetrics.emHeightAscent + idMetrics.emHeightAscent + 10);

    // Player level
    ctx.font = '900 22px InterBold';
    const playerLevel = user.player.level.toString();
    const levelMetrics = ctx.measureText(playerLevel);
    ctx.fillStyle = 'black';
    ctx.fillText(playerLevel, 105 + levelMetrics.width / 2, 184 + levelMetrics.emHeightAscent);

    // Current rank info
    const rankSize = 150;
    const actualRankImage = await loadRankIcon(lastPoint.new_level);
    ctx.drawImage(actualRankImage, 665, 60, rankSize, rankSize);

    // Rank text next to the icon
    const { rank: lastPointRank, tier: lastPointTier, color: lastPointColor } = getRankDetails(lastPoint.new_level);
    ctx.font = '900 40px InterBold';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    const rankText = `${lastPointRank} ${lastPointTier}`;
    const rankTextMetrics = ctx.measureText(rankText);
    ctx.fillText(rankText, 810, 100 + rankTextMetrics.emHeightAscent);
    // Current score
    ctx.fillStyle = '#737373';
    ctx.font = '900 24px InterBold';
    ctx.textAlign = 'left';
    const scoreText = `${lastPoint.new_score.toString().split('.')[0]} RS`;
    const scoreTextMetrics = ctx.measureText(scoreText);
    ctx.fillText(scoreText, 810, 100 + rankTextMetrics.emHeightAscent + scoreTextMetrics.emHeightAscent + 10);
    // Draw progression lines and fill
    scoreInfo.forEach((point, i) => {
        if (i === 0) {
            return;
        }

        const { color } = getRankDetails(scoreInfo[i - 1].new_level);

        // Line segment
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(xScale(i - 1), yScale(scoreInfo[i - 1].new_score));
        ctx.lineTo(xScale(i), yScale(point.new_score));
        ctx.stroke();

        // Gradient fill
        const gradient = ctx.createLinearGradient(
            0,
            yScale(Math.max(scoreInfo[i - 1].new_score, point.new_score)),
            0,
            MARGIN.top + chartHeight
        );
        gradient.addColorStop(0, `${color}CC`);
        gradient.addColorStop(1, `${color}00`);

        // Area below line
        ctx.beginPath();
        ctx.moveTo(xScale(i - 1), yScale(scoreInfo[i - 1].new_score));
        ctx.lineTo(xScale(i), yScale(point.new_score));
        ctx.lineTo(xScale(i), MARGIN.top + chartHeight);
        ctx.lineTo(xScale(i - 1), MARGIN.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Point circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(xScale(i - 1), yScale(scoreInfo[i - 1].new_score), 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw the last point in the loop
        if (i === scoreInfo.length - 1) {
            ctx.fillStyle = lastPointColor;
            ctx.beginPath();
            ctx.arc(xScale(i), yScale(point.new_score), 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw rank icons at rank changes - tamaño reducido
    let lastRank = '';
    let lastTier = '';
    for (let i = 0; i < scoreInfo.length; i++) {
        const point = scoreInfo[i];
        const { tier, rank } = getRankDetails(point.new_level);

        // Show icon when rank or tier changes
        if (rank !== lastRank || tier !== lastTier) {
            const rankImage = await loadRankIcon(point.new_level);
            const ICON_SIZE = 40;
            const TIER_FONT_SIZE = 16;
            const ICON_OFFSET = 5;

            const x = xScale(i) - ICON_SIZE / 2;
            const y = yScale(point.new_score) - ICON_SIZE - ICON_OFFSET;

            ctx.drawImage(rankImage, x, y, ICON_SIZE, ICON_SIZE);
            ctx.font = `bold ${TIER_FONT_SIZE}px InterBold`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(tier, x - ICON_SIZE / 8, y + 5);

            lastRank = rank;
            lastTier = tier;
        }

        // Always show final point rank
        if (i === scoreInfo.length - 1) {
            const rankImage = await loadRankIcon(point.new_level);
            const ICON_SIZE = 40;
            const TIER_FONT_SIZE = 16;
            const ICON_OFFSET = 5;

            const x = xScale(i) - ICON_SIZE / 2;
            const y = yScale(point.new_score) - ICON_SIZE - ICON_OFFSET;

            ctx.drawImage(rankImage, x, y, ICON_SIZE, ICON_SIZE);
            ctx.font = `bold ${TIER_FONT_SIZE}px InterBold`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(tier, x - ICON_SIZE / 8, y + 5);
        }
    }

    // Y-axis score ticks
    const NUM_Y_TICKS = 5;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px InterSemiBold';

    for (let i = 0; i <= NUM_Y_TICKS; i++) {
        const score = minScore + (maxScore - minScore) * (i / NUM_Y_TICKS);
        const y = yScale(score);

        ctx.beginPath();
        ctx.moveTo(MARGIN.left - 15, y);
        ctx.lineTo(MARGIN.left - 8, y);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillText(
            Math.round(score).toString().split('.')[0],
            MARGIN.left - 20,
            y
        );
    }

    // X-axis date labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px InterSemiBold';

    let lastMonth = -1;
    let lastDay = -1;

    const formatDate = (date: Date): string => {
        const day = date.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        return `${month} ${day}`;
    };

    for (let i = 0; i < dates.length; i++) {
        const currentDate = dates[i];
        const currentMonth = currentDate.getMonth();
        const currentDay = currentDate.getDate();

        if (currentMonth !== lastMonth || currentDay !== lastDay) {
            const x = xScale(i);

            // Dotted vertical reference line
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(x, yScale(scoreInfo[i].new_score));
            ctx.lineTo(x, MARGIN.top + chartHeight);
            ctx.strokeStyle = '#FFFFFF33';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Rotated date text
            ctx.save();
            const dateText = formatDate(currentDate);
            ctx.translate(x, MARGIN.top + chartHeight + 10);
            ctx.rotate(3 * Math.PI / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(dateText, 0, 0);
            ctx.restore();

            lastMonth = currentMonth;
            lastDay = currentDay;
        }
    }

    return canvas.encode('png');
}

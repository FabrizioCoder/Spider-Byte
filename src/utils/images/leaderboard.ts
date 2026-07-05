import type { Image } from '@napi-rs/canvas';

import { type SKRSContext2D, createCanvas, loadImage } from '@napi-rs/canvas';
import { join } from 'node:path';

import type { LeaderboardPlayerHeroDTO } from '../../types/dtos/LeaderboardPlayerHeroDTO';

import { loadRankIcon, loadUserIcon } from './_';

let first: Image | null = null;
let second: Image | null = null;
let third: Image | null = null;
let background: Image | null = null;

export async function generateLeaderboard(data: LeaderboardPlayerHeroDTO['players'], page: number) {
    if (!first) {
        const image = await loadImage(join(process.cwd(), 'assets', 'leaderboard', 'crowns', 'first.png'));
        first ??= image;
    }
    if (!second) {
        const image = await loadImage(join(process.cwd(), 'assets', 'leaderboard', 'crowns', 'second.png'));
        second ??= image;
    }
    if (!third) {
        const image = await loadImage(join(process.cwd(), 'assets', 'leaderboard', 'crowns', 'third.png'));
        third ??= image;
    }
    if (!background) {
        const image = await loadImage(join(process.cwd(), 'assets', 'leaderboard', 'blur_background.png'));
        background ??= image;
    }

    const canvas = createCanvas(900, 600);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0, 900, 600);

    ctx.font = '20px leaderboard';

    for (let i = 0; i < 9; i++) {
        const player = data.at(i);
        if (!player) {
            break;
        }

        const playerIndex = i + page * 9;

        const x = 60;
        const y = i * (canvas.height / 10.5) + 35;

        if (playerIndex === 0) {
            ctx.drawImage(first, x - 50, y + 2, 50, 40);
        } else if (playerIndex === 1) {
            ctx.drawImage(second, x - 50, y + 2, 50, 40);
        } else if (playerIndex === 2) {
            ctx.drawImage(third, x - 50, y + 2, 50, 40);
        } else {
            const rankText = `${playerIndex + 1}`;
            const rankMetrics = ctx.measureText(rankText);
            ctx.save();
            ctx.fillStyle = '#889cb5';
            ctx.font = '30px leaderboard';
            ctx.fillText(rankText, x - rankMetrics.width / 2 - 33, y + 39);
            ctx.restore();
        }

        let icon: Image;
        if (player.info.cur_head_icon_id) {
            icon = await loadUserIcon(player.info.cur_head_icon_id).catch(() => loadUserIcon('30000001'));

        } else {
            icon = await loadUserIcon('30000001');
        }
        ctx.drawImage(icon, x + 6, y + 10, 38, 38);

        ctx.fillStyle = 'black';

        ctx.globalAlpha = 0.8;
        ctx.fillText(player.info.name, x + 50, y + 35);
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#597392';
        const winrateText = `WR ${Math.floor(player.wins / player.matches * 100)}%`;
        const winrateMetrics = ctx.measureText(winrateText);
        ctx.fillText(winrateText, 560 - winrateMetrics.width / 2, y + 35);

        if (player.info.rank_season.level) {
            const rank = await loadRankIcon(player.info.rank_season.level);
            ctx.drawImage(rank, 600, y, 60, 60);
        }

        ctx.fillStyle = 'black';

        const matches = player.matches.toString();
        const matchesMetricts = ctx.measureText(matches);
        ctx.fillText(matches, 678 - matchesMetricts.width / 2, y + 35);

        const wins = player.wins.toString();
        const winsMetricts = ctx.measureText(wins);
        ctx.fillText(wins, 850 - winsMetricts.width / 2, y + 35);

        drawLine(ctx, 716, y + 20, 716, y + 40, '#8896B8');

        ctx.fillStyle = '#889cb5';
        const labelWins = 'Victories';
        const labelWinsMetricts = ctx.measureText(labelWins);
        ctx.fillText(labelWins, 765 - labelWinsMetricts.width / 2, y + 37);
    }

    return canvas.encode('png');
}


function drawLine(ctx: SKRSContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
}

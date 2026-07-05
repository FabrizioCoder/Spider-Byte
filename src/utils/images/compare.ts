import type { Image } from '@napi-rs/canvas';

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { join } from 'node:path';

import type { PlayerDTO } from '../../types/dtos/PlayerDTO';

import { loadUserIcon } from './_';

const Y_ICON = 84;
const Y_NAME = 221;
let background: Image | null = null;

export async function generateCompare(players: [PlayerDTO, PlayerDTO]) {
    if (!background) {
        const image = await loadImage(join(process.cwd(), 'assets', 'compare', 'background.png'));
        background ??= image;
    }

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(background, 0, 0);
    ctx.font = 'bold 30px leaderboard';

    const statsData = players.map((player) => {
        let kills = 0;
        let deaths = 0;
        let assists = 0;
        const mvp = player.overall_stats.ranked.total_mvp + player.overall_stats.unranked.total_mvp;

        player.heroes_ranked.concat(player.heroes_unranked).forEach((hero) => {
            kills += hero.kills;
            deaths += hero.deaths;
            assists += hero.assists;
        });

        const values = [
            player.overall_stats.total_matches,
            player.overall_stats.total_wins,
            `${(player.overall_stats.total_wins / player.overall_stats.total_matches * 100).toFixed(1)}%`,
            kills,
            deaths,
            assists,
            (kills / deaths).toFixed(1),
            mvp
        ];

        return {
            kills,
            deaths,
            assists,
            values
        };
    });

    for (let i = 0; i < 2; i++) {
        const data = players.at(i)!;
        const xAvatar = i === 0
            ? 65.5
            : 251.5;
        const avatar = await loadUserIcon(data.player.icon.player_icon_id);

        ctx.drawImage(avatar, xAvatar, Y_ICON, 100, 100);

        ctx.fillStyle = 'white';
        const nameText = players[i].player.name;
        const nameMetrics = ctx.measureText(nameText);
        ctx.fillText(nameText, xAvatar + 50 - nameMetrics.width / 2, Y_NAME);

        const playerStats = statsData.at(i)!;
        const otherPlayerStats = statsData.at(i === 0
            ? 1
            : 0)!;

        for (let j = 0; j < playerStats.values.length; j++) {
            const offSetY = j * 98;
            const Y_STAT = 291 + offSetY + 30;
            const statText = `${playerStats.values[j]}`;
            const statMetrics = ctx.measureText(statText);

            if (j === 4) {
                if (otherPlayerStats.values.at(j)! > playerStats.values.at(j)!) {
                    ctx.fillStyle = '#dfb540';
                } else {
                    ctx.fillStyle = 'white';
                }
            } else if (playerStats.values.at(j)! > otherPlayerStats.values.at(j)!) {
                ctx.fillStyle = '#dfb540';
            } else {
                ctx.fillStyle = 'white';
            }
            ctx.fillText(statText, xAvatar + avatar.width / 2 - statMetrics.width / 2 - 20, Y_STAT);
        }
    }

    return canvas.encode('png');
}

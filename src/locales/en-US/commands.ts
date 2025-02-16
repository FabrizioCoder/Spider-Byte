export const commands = {
    commonErrors: {
        playerNotFound: ':warning: Player not found. Provide a valid name or ID and try again.',
        noNameOrId: ':warning: No player name or ID provided. This is required to proceed.'
    },
    commonOptions: {
        nameOrId: 'Enter the player name or ID to identify the player.'
    },
    middlewares: {
        cooldown: {
            error: {
                user: (remaining: string) => `⏰ You're on cooldown. Wait ${remaining} to use this command again.`,
                channel: (remaining: string) => `⏰ Channel on cooldown. Wait ${remaining} to use this command again.`
            }
        }
    },
    ping: {
        name: 'ping',
        content: (latency: number) => `Ping: ${latency}ms. Current server latency.`
    },
    core: {
        compare: {
            name: 'compare',
            description: 'Compare stats of two players, including kills, wins, and mvp times.',
            samePlayer: ':warning: Same player provided twice. Use two different names or IDs.',
            options: {
                first: 'First player name or ID to compare.',
                second: 'Second player name or ID to compare.'
            }
        },
        profile: {
            name: 'profile',
            description: 'Get detailed stats like roles, rank, and top heroes for a player.'
        },
        rank: {
            name: 'rank',
            description: 'View a timeline graph of a player\'s rank history.',
            noRankHistory: (playerName: string, clubTeamId: string, uid: number) => `:warning: **${playerName}${clubTeamId === ''
                ? '** '
                : `#${clubTeamId}** `}(${uid}) has no rank history.`
        }
    },
    game: {
        patchNotes: {
            name: 'patch-notes',
            description: 'Get the latest patch notes or patch notes for a specific ID.',
            notFound: (id: string) => `:warning: Patch notes with ID ${id} not found. Check the ID and try again.`,
            noPatchNotes: ':warning: No patch notes available at the moment.',
            options: {
                id: 'The patch notes ID to retrieve specific updates.'
            }
        }
    },
    hero: {
        about: {
            name: 'about',
            description: 'Get detailed info about a hero, including abilities and stats.',
            notFound: (heroName: string) => `:warning: Hero ${heroName} not found. Check the name and try again.`,
            options: {
                name: 'The hero name to retrieve information about.'
            }
        },
        leaderboard: {
            name: 'leaderboard',
            description: 'View the leaderboard for a specific hero.',
            notFound: ':warning: No leaderboard found for this hero.',
            options: {
                hero: 'The hero to get leaderboard info for.'
            }
        }
    }
};

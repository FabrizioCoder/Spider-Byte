export const commands = {
    basicalErrors: {
        playerNotFound: 'Player not found. Provide a valid name or ID and try again.',
        noNameOrId: 'No player name or ID provided. This is required to proceed.'
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
        content: (latency: number) => `Ping: ${latency}ms. Current server latency.`
    },
    core: {
        compare: {
            description: 'Compare stats of two players, including ranks, roles, and top heroes.',
            samePlayer: 'Same player provided twice. Use two different names or IDs.',
            options: {
                first: 'First player name or ID to compare.',
                second: 'Second player name or ID to compare.'
            }
        },
        profile: {
            description: 'Get detailed stats like roles, rank, and top heroes for a player.'
        },
        rank: {
            description: 'View a timeline graph of a player\'s rank history.',
            noRankHistory: (playerName: string, clubTeamId: string, uid: string) => `**${playerName}${clubTeamId === ''
                ? '** '
                : `#${clubTeamId}** `}(${uid}) has no rank history.`
        }
    },
    game: {
        patchNotes: {
            description: 'Get the latest patch notes or for a specific ID.',
            notFound: (id: string) => `Patch notes with ID ${id} not found. Check the ID and try again.`,
            noPatchNotes: 'No patch notes available at the moment.',
            options: 'The patch notes ID to retrieve specific updates.'
        }
    },
    hero: {
        about: {
            description: 'Get detailed info about a hero, including abilities and stats.',
            notFound: (heroName: string) => `Hero ${heroName} not found. Check the name and try again.`,
            options: {
                hero: 'The hero name to retrieve information about.'
            }
        },
        leaderboard: {
            description: 'View the leaderboard for a specific hero.',
            notFound: 'No leaderboard found for this hero.',
            options: {
                hero: 'The hero to get leaderboard info for.'
            }
        }
    }
};

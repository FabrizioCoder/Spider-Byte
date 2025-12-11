export const commands = {
    others: {
        noVoted: 'Consider voting for us on top.gg to get more features. [Click here](https://top.gg/bot/1337677960546881587/vote).'
    },
    commonErrors: {
        playerNotFound: ':warning: Player not found. Provide a valid name or ID and try again.',
        noNameOrId: ':warning: No player name or ID provided. This is required to proceed.',
        noName: ':warning: No player name provided. This is required to proceed.',
        underDevelopment: ':warning: This command is under development. It will be available soon. Sorry for the inconvenience.',
        privateProfile: ':warning: This profile is set to private in game. To change this, follow the directions shown and try again.'
    },
    commonOptions: {
        nameOrId: {
            name: 'name-or-id',
            description: 'Enter the player name to identify the player.'
        },
        name: {
            name: 'name',
            description: 'Enter the player name to identify the player.' // This is used in some commands where ID is not applicable
        },
        gameMode: {
            name: 'game-mode',
            description: 'Choose the game mode to display stats for.'
        },
        season: {
            name: 'season',
            description: 'Choose the season to display stats for. If not specified, the latest season will be used.'
        },
        page: {
            name: 'page',
            description: 'Page number in pagination'
        }
    },
    middlewares: {
        cooldown: {
            error: {
                user: (remaining: string) => `⏰ You're on cooldown. Wait ${remaining} to use this command again.`,
                channel: (remaining: string) => `⏰ Channel on cooldown. Wait ${remaining} to use this command again.`
            }
        }
    },
    help: {
        name: 'help',
        description: 'Display information about available commands.',
        options: {
            command: {
                name: 'command',
                description: 'Specific command to get help for.'
            }
        },
        noCommandFound: ':warning: Command not found. Check the command name and try again.',
        embed: {
            title: '📚 Available Commands',
            description: 'Here are all available commands.\nUse `/help command:commandname` for detailed information.',
            color: 0x2B2D31,
            timestamp: new Date().toISOString()
        },
        commandDetailsEmbed: (commandName: string) => ({
            title: `Command \`/${commandName}\``,
            description: 'Detailed information about the command.',
            color: 0x2B2D31,
            timestamp: new Date().toISOString()
        }),
        fields: {
            allCommands: '📑 Commands',
            subcommands: '📑 SubCommands',
            options: '⚙️ Options',
            cooldown: '⏱️ Cooldown'
        }
    },
    ping: {
        name: 'ping',
        description: 'Check the bot\'s latency',
        content: (avglatency: number, shardLatency: number) => `Ping: ${avglatency}ms. Current server latency. Shard latency: ${shardLatency}ms.`
    },
    player: {
        name: 'player',
        description: 'View player profiles, compare stats, and track rank progression',
        compare: {
            name: 'compare',
            description: 'Compare stats of two players, including kills, wins, and MVP times.',
            samePlayer: ':warning: Same player provided twice. Use two different names or IDs.',
            options: {
                first: {
                    name: 'first',
                    description: 'First player name or ID to compare.'
                },
                second: {
                    name: 'second',
                    description: 'Second player name or ID to compare.'
                }
            }
        },
        profile: {
            name: 'profile',
            description: 'Get detailed stats like roles, rank, and top heroes for a player.',
            options: {
                imageVersion: {
                    name: 'image-version',
                    description: 'Choose the image version to display stats for.'
                }
            }
        },
        rank: {
            name: 'rank',
            description: 'View a timeline graph of a player\'s rank history.',
            noRankHistory: (playerName: string, clubTeamId: string | null) => `:warning: **${playerName}${clubTeamId
                ? `#${clubTeamId}** `
                : '** '} has no rank history.`,
            noRankData: (playerName: string, clubTeamId: string | null) => `:warning: **${playerName}${clubTeamId
                ? `#${clubTeamId}** `
                : '** '} has no rank data available for the selected season.`,
            options: {
                limit: {
                    name: 'limit',
                    description: 'The number of matches to display in the graph.'
                }
            }
        },
        update: {
            name: 'update',
            description: 'Update a player\'s stats.',
            updatedRecently: (playerName: string) => `:warning: **${playerName}** has been updated recently. Try again later.`,
            cantUpdate: (playerName: string, uid: number | string) => `Can't update **${playerName}(${uid})** stats. Try again later.`,
            success: (playerName: string, uid: number | string) => `:white_check_mark: **${playerName}(${uid})** stats has been updated. Data may take up to a while to reflect.`
        },
        uid: {
            name: 'uid',
            description: 'Get the player UID by the player name.'
        }
    },
    game: {
        name: 'game',
        description: 'Access game maps information and latest patch notes',
        patchNotes: {
            name: 'patch-notes',
            description: 'Get the latest patch notes or patch notes for a specific ID.',
            notFound: (id: string) => `:warning: Patch notes with ID ${id} not found. Check the ID and try again.`,
            noPatchNotes: ':warning: No patch notes available at the moment.',
            options: {
                id: {
                    name: 'id',
                    description: 'The patch notes ID to retrieve specific updates.'
                }
            }
        },
        map: {
            name: 'map',
            description: 'Get detailed information about a specific map.',
            notFound: ':warning: Map not found. Check the name and try again.',
            options: {
                name: {
                    name: 'name',
                    description: 'The name of the map to retrieve information about.'
                }
            }
        }
    },
    hero: {
        name: 'hero',
        description: 'Get detailed information about a specific hero.',
        about: {
            name: 'about',
            description: 'Get detailed info about a hero, including abilities and stats.',
            notFound: (heroName: string) => `:warning: Hero ${heroName} not found. Check the name and try again.`,
            options: {
                name: {
                    name: 'name',
                    description: 'The hero name to retrieve information about.'
                }
            }
        },
        leaderboard: {
            name: 'leaderboard',
            description: 'View the leaderboard for a specific hero.',
            notFound: ':warning: No leaderboard found for this hero.',
            options: {
                hero: {
                    name: 'hero',
                    description: 'The hero to get leaderboard info for.'
                },
                platform: {
                    name: 'platform',
                    description: 'The platform to get leaderboard info for.'
                }
            }
        }
    },
    match: {
        name: 'match',
        description: 'View match details and history',
        history: {
            name: 'history',
            description: 'View match history for a specific player.',
            noHistory: (playerName: string) => `:warning: No match history found for **${playerName}**.`,
            options: {
                skip: {
                    name: 'skip',
                    description: 'Number of matches to skip'
                }
            }
        }
    },
    account: {
        name: 'account',
        description: 'Link or unlink your game account to your Discord account.',
        link: {
            name: 'link',
            description: 'Link your game account to your Discord account.',
            alreadyLinked: ':warning: You already have a linked account. Use `/account unlink` to unlink it first.',
            success: (playerName: string, uid: number) => `:white_check_mark: Successfully linked **${playerName}** (${uid}) to your Discord account.`
        },
        unlink: {
            name: 'unlink',
            description: 'Unlink your game account from your Discord account.',
            notLinked: ':warning: You don\'t have a linked account. Use `/account link` to link it first.',
            success: (uid: string) => `:white_check_mark: Successfully unlinked account with UID **${uid}** from your Discord account.`
        }
    }
};

import type { commands as English } from '../en-US/commands.ts';

const commands = {
    others: {
        noVoted: 'Considera votar por nosotros en top.gg para obtener más funciones. [Haz clic aquí](https://top.gg/bot/1337677960546881587/vote).'
    },
    commonErrors: {
        playerNotFound: ':warning: Jugador no encontrado. Proporciona un nombre o ID válido e intenta de nuevo.',
        noNameOrId: ':warning: No se proporcionó nombre o ID. Este dato es necesario para continuar.',
        noName: ':warning: No se proporcionó nombre del jugador. Este dato es necesario para continuar.',
        underDevelopment: ':warning: Este comando está en desarrollo. Pronto estará disponible. Disculpa las molestias.',
        privateProfile: ':warning: Este perfil está configurado como privado en el juego. Para cambiarlo, sigue las instrucciones que se muestran e intenta de nuevo.'
    },
    commonOptions: {
        nameOrId: {
            name: 'nombre-o-id',
            description:
                'Ingresa el nombre del jugador para identificarlo.'
        },
        name: {
            name: 'nombre',
            description:
                'Ingresa el nombre del jugador para identificarlo.' // Esto se usa en algunos comandos donde el ID no es aplicable
        },
        gameMode: {
            name: 'modo-de-juego',
            description:
                'Elige el modo de juego para mostrar estadísticas.'
        },
        season: {
            name: 'temporada',
            description:
                'Elige la temporada para mostrar estadísticas. Si no se especifica, se usará la última temporada.'
        },
        page: {
            name: 'página',
            description:
                'Número de página en la paginación'
        }
    },
    middlewares: {
        cooldown: {
            error: {
                user: (remaining) => `⏰ Estás en cooldown. Espera ${remaining} para usar este comando de nuevo.`,
                channel: (remaining) => `⏰ El canal está en cooldown. Espera ${remaining} para usar este comando de nuevo.`
            }
        }
    },
    help: {
        name: 'ayuda',
        description: 'Muestra información sobre los comandos disponibles.',
        options: {
            command: {
                name: 'comando',
                description: 'Comando específico del cual obtener ayuda.'
            }
        },
        noCommandFound: ':warning: Comando no encontrado. Verifica el nombre del comando e intenta de nuevo.',
        embed: {
            title: '📚 Comandos Disponibles',
            description: 'Aquí están todos los comandos disponibles.\nUsa `/help command:nombredelcomando` para información detallada.',
            color: 0x2B2D31,
            timestamp: new Date().toISOString()
        },
        commandDetailsEmbed: (commandName) => ({
            title: `Comando \`/${commandName}\``,
            description: 'Información detallada sobre el comando.',
            color: 0x2B2D31,
            timestamp: new Date().toISOString()
        }),
        fields: {
            allCommands: '📑 Comandos',
            subcommands: '📑 SubComandos',
            options: '⚙️ Opciones',
            cooldown: '⏱️ Tiempo de Espera'
        }
    },
    ping: {
        name: 'latencia',
        description: 'Verifica la latencia del bot',
        content: (avglatency, shardLatency) => `Ping: ${avglatency}ms. Latencia actual con el servidor. Latencia del shard: ${shardLatency}ms.`
    },
    player: {
        name: 'jugador',
        description: 'Ver perfiles de jugadores, comparar estadísticas y rastrear progresión de rangos',
        compare: {
            name: 'compare',
            description: 'Compara estadísticas de dos jugadores, incluyendo asesinatos, victorias y veces como MVP.',
            samePlayer: ':warning: Se proporcionó el mismo jugador dos veces. Usa dos nombres o IDs diferentes.',
            options: {
                first: {
                    name: 'primer',
                    description: 'Nombre o ID del primer jugador a comparar.'
                },
                second: {
                    name: 'segundo',
                    description: 'Nombre o ID del segundo jugador a comparar.'
                }
            }
        },
        profile: {
            name: 'perfil',
            description: 'Ver perfiles de jugadores, comparar estadísticas y rastrear progresión de rangos',
            options: {
                imageVersion: {
                    name: 'versión-de-imagen',
                    description: 'Elige la versión de imagen para mostrar estadísticas.'
                }
            }
        },
        rank: {
            name: 'rango',
            description: 'Muestra una gráfica de la historia de rangos de un jugador.',
            noRankHistory: (playerName, clubTeamId) => `:warning: **${playerName}${clubTeamId
                ? `#${clubTeamId}** `
                : '** '} no tiene historial de rangos.`,
            noRankData: (playerName, clubTeamId) => `:warning: **${playerName}${clubTeamId
                ? `#${clubTeamId}** `
                : '** '} no tiene datos de rango disponibles para la temporada seleccionada.`,
            options: {
                limit: {
                    name: 'límite',
                    description: 'Número de partidas a mostrar en la gráfica.'
                }
            }
        },
        update: {
            name: 'actualizar',
            description: 'Actualiza las estadísticas de un jugador.',
            updatedRecently: (playerName) => `:warning: **${playerName}** ya se actualizó recientemente. Intenta de nuevo más tarde.`,
            cantUpdate: (playerName, uid) => `No se puede actualizar **${playerName}(${uid})**. Intenta de nuevo más tarde.`,
            success: (playerName, uid) => `:white_check_mark: **${playerName}(${uid})** estadísticas actualizadas. Los datos pueden tardar unos minutos en aparecer.`
        },
        uid: {
            name: 'uid',
            description: 'Obtén el UID del jugador por su nombre.'
        }
    },
    game: {
        name: 'juego',
        description: 'Muestra información sobre el juego, incluyendo mapas y notas de parches.',
        patchNotes: {
            name: 'patch-notes',
            description: 'Obtén las últimas notas de parche o para un ID específico.',
            notFound: (id) => `Notas de parche con ID ${id} no encontradas. Revisa el ID e intenta de nuevo.`,
            noPatchNotes: ':warning: No hay notas de parche disponibles en este momento.',
            options: {
                id: {
                    name: 'id',
                    description: 'El ID de las notas de parche para obtener actualizaciones específicas.'
                }
            }
        },
        map: {
            name: 'map',
            description: 'Obtén información detallada de un mapa específico.',
            notFound: 'Mapa no encontrado. Revisa el nombre e intenta de nuevo.',
            options: {
                name: {
                    name: 'nombre',
                    description: 'El nombre del mapa para obtener información.'
                }
            }
        }
    },
    hero: {
        name: 'héroe',
        description: 'Obtén información detallada sobre héroes, incluyendo estadísticas y habilidades.',
        about: {
            name: 'about',
            description: 'Obtén información detallada de un héroe, incluyendo habilidades y estadísticas.',
            notFound: (heroName) => `:warning: Héroe ${heroName} no encontrado. Revisa el nombre e intenta de nuevo.`,
            options: {
                name: {
                    name: 'nombre',
                    description: 'El nombre del héroe para obtener información.'
                }
            }
        },
        leaderboard: {
            name: 'leaderboard',
            description: 'Muestra la tabla de clasificación de un héroe específico.',
            notFound: ':warning: No se encontró tabla de clasificación para este héroe.',
            options: {
                hero: {
                    name: 'héroe',
                    description: 'El héroe para obtener información de clasificación.'
                },
                platform: {
                    name: 'plataforma',
                    description: 'La plataforma para obtener información de clasificación.'
                }
            }
        }
    },
    match: {
        name: 'partida',
        description: 'Muestra información sobre partidas, incluyendo estadísticas y detalles de jugadores.',
        history: {
            name: 'history',
            description: 'Muestra el historial de partidas de un jugador.',
            noHistory: (playerName) => `:warning: **${playerName}** no tiene historial de partidas.`,
            options: {
                skip: {
                    name: 'saltar',
                    description: 'Número de partidas a omitir en la paginación.'
                }
            }
        }
    },
    account: {
        name: 'cuenta',
        description: 'Vincula o desvincula tu cuenta del juego a tu cuenta de Discord.',
        link: {
            name: 'link',
            description: 'Vincula tu cuenta del juego a tu cuenta de Discord.',
            alreadyLinked: ':warning: Ya tienes una cuenta vinculada. Utiliza `/account unlink` para desvincularla primero.',
            success: (playerName: string, uid: number) => `:white_check_mark: Se ha vinculado correctamente **${playerName}** (${uid}) a tu cuenta de Discord.`
        },
        unlink: {
            name: 'unlink',
            description: 'Desvincula tu cuenta del juego de tu cuenta de Discord.',
            notLinked: ':warning: No tienes una cuenta vinculada. Usa `/account link` para vincularla primero.',
            success: (uid: string) => `:white_check_mark: Se ha desvinculado correctamente la cuenta con UID **${uid}** de tu cuenta de Discord.`
        }
    }
} satisfies typeof English;

export { commands };

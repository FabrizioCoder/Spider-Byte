import { Api as TopGGAPI } from '@top-gg/sdk';
import { createClient } from '@redis/client';
import { createPlugin } from 'seyfert';

import { TOPGG_TOKEN, API_KEY } from '../utils/env';
import { PrismaClient } from '../../prisma/client';
import { Api } from '../lib/managers/api';

// App-wide service singletons exposed as typed `client.*` / `ctx.client.*` through the
// plugin system, instead of hand-augmenting SeyfertRegistry.client. Their types flow into
// UsingClient via the `plugins: typeof plugins` registry augmentation in index.ts.
export function servicesPlugin() {
    // @redis/client infers a concrete RESP3 client; Api/consumers expect the generic
    // ReturnType<typeof createClient>. Same runtime value — assert the declared type.
    const redis = createClient();
    const prisma = new PrismaClient();
    const api = new Api(API_KEY, redis);
    const topgg = new TopGGAPI(TOPGG_TOKEN);

    return createPlugin({
        name: 'spider-byte-services',
        // sync factories — instances are built above; async startup goes in setup()
        client: {
            redis: () => redis,
            prisma: () => prisma,
            api: () => api,
            topgg: () => topgg
        },
        async setup(
            client
        ) {
            redis.on('error', (err) => {
                client.logger.error('Redis Client Error', err);
            });
            await redis.connect();
            await prisma.$connect();
            await api.getHeroes();
            await api.getAllMaps();
        }
        // ponytail: no teardown — app never calls client.close(); add redis.close()/prisma.$disconnect()
        // here + wire SIGTERM->client.close() if graceful shutdown is needed.
    });
}

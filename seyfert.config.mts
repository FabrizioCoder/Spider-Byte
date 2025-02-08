import { config } from 'seyfert';

const BOT_TOKEN = Bun.env.BOT_TOKEN;

console.log(BOT_TOKEN);

if (!BOT_TOKEN?.trim()) {
    throw new Error('Bun.env.BOT_TOKEN is not a valid token');
}

const API_KEY = Bun.env.API_KEY;

if (!API_KEY?.trim()) {
    throw new Error('Bun.env.API_KEY is not a valid api key');
}

export default config.bot({
    token: BOT_TOKEN,
    locations: {
        base: 'src',
        commands: 'commands',
        langs: 'locales'
    },
    apiKey: API_KEY
});

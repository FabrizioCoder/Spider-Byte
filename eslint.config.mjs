import theConfig from '@marcrock22/eslint';
import { defineConfig } from 'eslint/config';
import { configs as seyfert } from '@slipher/eslint-plugin';

export default defineConfig(
    theConfig,
    ...seyfert.recommended,
    {
        ignores: ["prisma/**", "dist/**", "node_modules/**"],
    },
    {
        rules: {
            '@typescript-eslint/class-methods-use-this': ['error', {
                ignoreOverrideMethods: true,
            }],
        }
    }
);
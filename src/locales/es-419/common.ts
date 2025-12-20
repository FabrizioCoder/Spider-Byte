import type { common as commonDefault } from '../en-US/common';

export const common = {
    date(dd, mm, yyyy) {
        return `${dd}/${mm}/${yyyy}`;
    },
    imageCreatedIn: (ms: number) => `Imagen creada en ${ms.toFixed(2)} ms`
} satisfies typeof commonDefault;

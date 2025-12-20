export const common = {
    date(dd: string | number, mm: string | number, yyyy: string | number) {
        return `${mm}/${dd}/${yyyy}`;
    },
    imageCreatedIn: (ms: number) => `Image created in ${ms.toFixed(2)} ms`
};

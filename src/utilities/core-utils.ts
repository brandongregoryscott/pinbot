import pThrottle from "p-throttle";

const CoreUtils = {
    randomInt(max: number): number {
        return Math.floor(Math.random() * max);
    },
    randomItem<T>(items: T[], filter?: (item: T) => boolean): T {
        if (filter == null || items.filter(filter).length === 0) {
            return items[this.randomInt(items.length)];
        }

        items = items.filter(filter);
        return items[this.randomInt(items.length)];
    },
    throttle<TArgs extends readonly unknown[], TReturnValue>(
        fn: (...args: TArgs) => TReturnValue
    ) {
        return pThrottle({
            limit: 2,
            interval: 250,
        })(fn);
    },
    formatTimestamp(timestamp: string): string {
        const date = new Date(Number(timestamp) * 1000); // JavaScript expects timestamps in milliseconds
        return date.toDateString();
    },
};

export { CoreUtils };

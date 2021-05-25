import pThrottle from "p-throttle";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const CoreUtils = {
    randomInt(max: number): number {
        return Math.floor(Math.random() * max);
    },
    randomItem<T>(items: T[]): T {
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

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { CoreUtils };

// #endregion Exports

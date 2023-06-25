import pThrottle from "p-throttle";

const randomInt = (max: number): number => Math.floor(Math.random() * max);

const randomItem = <T>(items: T[], filter?: (item: T) => boolean): T => {
    if (filter == null || items.filter(filter).length === 0) {
        return items[randomInt(items.length)];
    }

    const filteredItems = items.filter(filter);
    return randomItem(filteredItems);
};

const throttle = <TArgs extends readonly unknown[], TReturnValue>(
    fn: (...args: TArgs) => TReturnValue
) => {
    return pThrottle({
        limit: 2,
        interval: 250,
    })(fn);
};

const formatTimestamp = (timestamp: string): string => {
    // JavaScript expects timestamps in milliseconds
    const date = new Date(Number(timestamp) * 1000);
    return date.toDateString();
};

export { formatTimestamp, randomInt, randomItem, throttle };

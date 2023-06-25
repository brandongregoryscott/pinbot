import { randomInt, randomItem } from "./core-utils";
import times from "lodash/times";

describe("CoreUtils", () => {
    describe("randomInt", () => {
        it("does not return item greater than max", () => {
            const max = 50;

            times(1000, () => {
                const result = randomInt(max);

                expect(result).toBeLessThanOrEqual(max);
            });
        });
    });

    describe("randomItem", () => {
        it("does not return undefined (item out of array length)", () => {
            times(1000, () => {
                const items = [
                    "Banana",
                    "Orange",
                    "Apple",
                    "Pear",
                    "Watermelon",
                ];
                const result = randomItem(items);

                expect(result).toBeDefined();
            });
        });

        it("does not return item that is filtered out", () => {
            times(1000, () => {
                const items = [
                    "Banana",
                    "Orange",
                    "Apple",
                    "Pear",
                    "Watermelon",
                ];
                const result = randomItem(items, (item) => item !== "Banana");

                expect(result).not.toBe("Banana");
            });
        });
    });
});

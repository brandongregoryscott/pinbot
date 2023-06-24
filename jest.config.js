/**
 * @type {import('jest').Config}
 */
const config = {
    transform: {
        ".ts": [
            "ts-jest",
            { diagnostics: false, tsconfig: "<rootDir>/tsconfig.json" },
        ],
    },
    clearMocks: true,
    modulePathIgnorePatterns: ["<rootDir>/dist"],
    preset: "ts-jest",
    restoreMocks: true,
    testEnvironment: "node",
    silent: false,
};

module.exports = config;

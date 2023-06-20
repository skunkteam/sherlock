const nxPreset = require('@nx/jest/preset').default;

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('jest').Config} */
module.exports = {
    ...nxPreset,
    collectCoverage: true,
    coverageReporters: ['text', 'lcovonly', 'html'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    collectCoverageFrom: ['**/*.ts', '!**/index.ts', '!**/internal.ts', '!**/*.tests.ts', '!jest.config.ts'],
    setupFilesAfterEnv: ['jest-extended/all'],
    clearMocks: true,
    restoreMocks: true,
};

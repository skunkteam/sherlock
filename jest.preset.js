const nxPreset = require('@nrwl/jest/preset');

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
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
    collectCoverageFrom: ['**/*.ts', '!**/index.ts', '!**/internal.ts', '!**/*.tests.ts'],
    setupFilesAfterEnv: ['jest-extended'],
    clearMocks: true,
    restoreMocks: true,
};

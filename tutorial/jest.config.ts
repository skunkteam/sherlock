import type { Config } from 'jest';

export default {
    displayName: 'tutorial',
    preset: '../jest.preset.js',
    globals: {},
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]sx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
    },
    collectCoverage: false,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
} satisfies Config;

import type { Config } from 'jest';

export default {
    displayName: 'ngx-sherfire',
    preset: '../../jest.preset.js',
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
    globals: {},
    coverageDirectory: '../../coverage/libs/ngx-sherfire',
    snapshotSerializers: [
        'jest-preset-angular/build/serializers/no-ng-attributes',
        'jest-preset-angular/build/serializers/ng-snapshot',
        'jest-preset-angular/build/serializers/html-comment',
    ],
    transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
    transform: {
        '^.+\\.(ts|mjs|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$',
            },
        ],
    },
    // Set the default jest environment to a slightly extended variant where TextDecoder/-Encoder is globally available.
    // This solves the problem that TextDecoder cannot be found in the backend .spec files when they are called via frontend tests.
    // Backend tests that are executed directly overwrite the testEnvironment to node.
    testEnvironment: 'jest-environment-jsdom-sherlock',
} satisfies Config;

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
    // Zet de standaard jest environment naar een licht uitgebreide variant waar TextDecoder/Encoder globaal beschikbaar is.
    // Dit lost het probleem op dat TextDecoder niet in de backend .spec files gevonden kan worden als ze via frontend tests aangeroepen worden.
    // Backend tests die direct uitgevoerd worden, overschrijven de testEnvironment naar node.
    testEnvironment: 'jest-environment-jsdom-sherlock',
} satisfies Config;

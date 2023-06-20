import { getJestProjects } from '@nx/jest';
import { Config } from 'jest';

export default {
    projects: [
        ...getJestProjects(),
        '<rootDir>/libs/sherlock',
        '<rootDir>/libs/sherlock-utils',
        '<rootDir>/libs/ngx-sherlock',
        '<rootDir>/libs/ngx-sherfire',
    ],
} satisfies Config;

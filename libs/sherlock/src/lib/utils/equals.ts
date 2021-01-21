import { config } from './config';

/**
 * Returns whether the two arguments are either:
 * - equal according to JavaScript rules
 * - equal according to the configurable equals functions
 */
export function equals(a: unknown, b: unknown) {
    return Object.is(a, b) || config.equals(a, b);
}

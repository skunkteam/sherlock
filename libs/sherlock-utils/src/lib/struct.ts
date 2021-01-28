import { Derivable, derive, isDerivable, utils } from '@skunkteam/sherlock';

/**
 * Converts a map or array of Derivables or any nested structure containing maps, arrays and Derivables into a single
 * Derivable with all nested Derivables unwrapped into it.
 *
 * ```typescript
 * const obj = { key1: atom(123), key2: atom(456) };
 * const obj$ = struct(obj);
 * expect(obj$.get()).to.deep.equal({ key1: 123, key2: 456 });
 * ```
 *
 * It only touches Arrays, plain Objects and Derivables, the rest is simply returned inside the Derivable as-is.
 *
 * @param obj the object to deepunwrap into a derivable
 */
export function struct<T>(input: T): Derivable<StructUnwrap<T>> {
    return (isDerivable(input) ? input : derive(deepUnwrap, input)) as Derivable<StructUnwrap<T>>;
}

function deepUnwrap(obj: any): any {
    if (isDerivable(obj)) {
        return obj.get();
    }
    if (Array.isArray(obj)) {
        return obj.map(deepUnwrap);
    }
    if (utils.isPlainObject(obj)) {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(obj)) {
            result[key] = deepUnwrap(obj[key]);
        }
        return result;
    }
    return obj;
}

export type StructUnwrap<T> = T extends Derivable<infer V>
    ? V
    : T extends Record<string, unknown>
    ? { [K in keyof T]: StructUnwrap<T[K]> }
    : T extends unknown[]
    ? { [K in keyof T]: StructUnwrap<T[K]> }
    : T;

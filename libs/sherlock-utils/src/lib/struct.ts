import { Derivable, derive, isDerivable, unresolved, utils } from '@skunkteam/sherlock';

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
 * This function unwraps Derivables one by one, waiting for a Derivable to become resolved before looking for the next
 * Derivable.
 *
 * @param input the object to deepunwrap into a derivable
 */
export function struct<T>(input: T): Derivable<StructUnwrap<T>> {
    return (isDerivable(input) ? input : derive(deepUnwrapSerial, input)) as Derivable<StructUnwrap<T>>;
}

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
 * This function eagerly activates Derivables in the input, so they get activated ("connected") in parallel.
 *
 * @param input the object to deepunwrap into a derivable
 */
export function parallelStruct<T>(input: T): Derivable<StructUnwrap<T>> {
    return (isDerivable(input) ? input : derive(deepUnwrapParallel, input)) as Derivable<StructUnwrap<T>>;
}

function deepUnwrapSerial(obj: any) {
    return deepUnwrap(obj, d$ => d$.get());
}

function deepUnwrapParallel(obj: any) {
    let resolved = true;
    const value = deepUnwrap(obj, d$ => {
        resolved &&= d$.resolved;
        return d$.value;
    });
    return resolved ? value : unresolved;
}

function deepUnwrap(obj: any, handleDerivable: (d$: Derivable<unknown>) => unknown): any {
    if (isDerivable(obj)) {
        return handleDerivable(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(element => deepUnwrap(element, handleDerivable));
    }
    if (utils.isPlainObject(obj)) {
        const result: Record<string, unknown> = {};
        for (const key of Object.keys(obj)) {
            result[key] = deepUnwrap(obj[key], handleDerivable);
        }
        return result;
    }
    return obj;
}

export type StructUnwrap<T> = T extends Derivable<infer V>
    ? V
    : T extends Record<string, unknown>
    ? { readonly [K in keyof T]: StructUnwrap<T[K]> }
    : T extends readonly unknown[]
    ? { readonly [K in keyof T]: StructUnwrap<T[K]> }
    : T;

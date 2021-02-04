import type {
    Derivable,
    DerivableAtom,
    LensDescriptor,
    MaybeFinalState,
    SettableDerivable,
    UnwrappableTuple,
    UnwrapTuple,
} from '../interfaces';
import { unresolved as unresolvedSymbol } from '../symbols';
import { error, final } from '../utils';
import { Atom } from './atom';
import { Derivation } from './derivation';
import { Lens } from './lens';

const finalUnresolved = final(unresolvedSymbol);

/**
 * Construct a new atom with the provided initial value.
 *
 * @param value the initial value
 */
export function atom<V>(value: V): DerivableAtom<V> {
    return new Atom(value);
}
atom.unresolved = function unresolved<V>(): DerivableAtom<V> {
    return new Atom<V>(unresolvedSymbol);
};
atom.error = function createError<V>(err: unknown): DerivableAtom<V> {
    return new Atom<V>(error(err));
};
atom.final = constant;

/**
 * Creates a new constant with the given value.
 *
 * @param value the immutable value of this Constant
 */
export function constant<V>(value: V): Derivable<V> {
    return new Atom<V>(final(value));
}
constant.unresolved = function unresolved<V>(): Derivable<V> {
    return new Atom<V>(finalUnresolved);
};
constant.error = function createError<V>(err: unknown): Derivable<V> {
    return new Atom<V>(final(error(err)));
};

/**
 * Create a new derivation using the deriver function.
 *
 * @param deriver the deriver function
 */
export function derive<R, PS extends unknown[] = []>(
    deriver: (...ps: UnwrapTuple<PS>) => MaybeFinalState<R>,
    ...ps: PS
): Derivable<R> {
    return new Derivation(deriver as (...args: any[]) => MaybeFinalState<R>, ps.length ? ps : undefined);
}

/**
 * Create a new Lens using a get and a set function. The get is used as an normal deriver function
 * including the automatic recording of dependencies, the set is used as a sink for new values.
 *
 * @param descriptor the get and set functions
 */
export function lens<V, PS extends unknown[] = []>(
    descriptor: LensDescriptor<V, PS>,
    ...ps: UnwrappableTuple<PS>
): SettableDerivable<V> {
    return new Lens(descriptor, ps.length ? ps : undefined);
}

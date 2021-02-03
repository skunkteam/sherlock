import { Derivable, derive, MaybeFinalState, unwrap, UnwrappableTuple } from '@skunkteam/sherlock';

/**
 * Lifts the function f into a function over Derivables returning a Derivable, for example:
 *
 *     const minLength = lift((s: string) => s.length > 3);
 *     const s$ = atom('abcd');
 *     const hasMinLength$ = minLength(s$);
 *     console.log(hasMinLength$.get()) // true
 *
 * @param f the function to lift into a function over Derivables
 */
export function lift<PS extends unknown[], R>(
    f: (...ps: PS) => MaybeFinalState<R>,
): (...ps: UnwrappableTuple<PS>) => Derivable<R> {
    return (...ps: UnwrappableTuple<PS>) => derive(() => f(...(ps.map(unwrap) as PS)));
}

export type DerivableTuple<T extends unknown[]> = { [K in keyof T]: Derivable<T[K]> };

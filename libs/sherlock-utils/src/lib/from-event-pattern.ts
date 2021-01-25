import { atom, Derivable, DerivableAtom } from '@skunkteam/sherlock';

/**
 * A utility function to create a `Derivable` from an arbitrary event pattern. The provided `subscribe` callback is
 * called whenever the returned Derivable gets connected (gets its first observer). This callback is given an atom to
 * which all updates should be written and it should return an `unsubscribe` callback for when the Derivable gets
 * disconnected (loses its last observer).
 *
 * @param subscribe The callback that is called when the `Derivable` is connected and should start producing data.
 */
export function fromEventPattern<V>(subscribe: (value$: DerivableAtom<V>) => () => void): Derivable<V> {
    const value$ = atom.unresolved<V>();

    let unsubscribe: (() => void) | undefined;
    value$.connected$.react(
        () => {
            if (value$.connected && !unsubscribe) {
                unsubscribe = subscribe(value$);
            }
            // This is not chained with the previous as an `else` branch, because this can be true immediately after
            // the subscription occurs. For example, Observables can complete synchronously on subscription.
            if (!value$.connected && unsubscribe) {
                unsubscribe();
                unsubscribe = undefined;
                // Only remember values that were explicitly set as final. When not final we must remove the current
                // value both stale-cache problems and possible prevent memory leaks.
                value$.final || value$.unset();
            }
        },
        { skipFirst: true }, // `skipFirst` to skip the first (synchronous) `connected == false` message
    );
    return value$;
}

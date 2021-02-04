import { atom, Derivable, error } from '@skunkteam/sherlock';

export function fromPromise<V>(prom: Promise<V>): Derivable<V> {
    const atom$ = atom.unresolved<V>();
    prom.then(
        v => atom$.setFinal(v),
        e => atom$.setFinal(error(e)),
    );
    return atom$;
}

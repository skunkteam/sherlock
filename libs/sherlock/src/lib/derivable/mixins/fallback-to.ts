import type { Derivable, Fallback, State } from '../../interfaces';
import { unresolved } from '../../symbols';
import { derive } from '../factories';
import { resolveFallback } from '../resolve-fallback';
import { isDerivable } from '../typeguards';

export function fallbackToMethod<V, T>(this: Derivable<V>, fallback: Fallback<State<T>>): Derivable<V | T> {
    if (isDerivable(fallback)) {
        return derive(() => this.getOr(fallback));
    }
    return this.mapState(state => (state === unresolved ? resolveFallback(fallback) : state));
}

import type { DerivableAtom } from '../../interfaces';
import { unresolved } from '../../symbols';
import { error, final } from '../../utils';

export function unsetMethod<V>(this: DerivableAtom<V>) {
    this.set(unresolved);
}

export function setErrorMethod<V>(this: DerivableAtom<V>, err: unknown) {
    this.set(error(err));
}

export function setFinalMethod<V>(this: DerivableAtom<V>, value: V) {
    this.set(final(value));
}

export function makeFinalMethod<V>(this: DerivableAtom<V>) {
    this.final || this.setFinal(this.getState());
}

import { DerivableAtom } from '../../interfaces';
import { unresolved } from '../../symbols';
import { ErrorWrapper, FinalWrapper } from '../../utils';

export function unsetMethod<V>(this: DerivableAtom<V>) {
    this.set(unresolved);
}

export function setErrorMethod<V>(this: DerivableAtom<V>, err: unknown) {
    this.set(new ErrorWrapper(err));
}

export function setFinalMethod<V>(this: DerivableAtom<V>, value: V) {
    this.set(FinalWrapper.wrap(value));
}

export function makeFinalMethod<V>(this: DerivableAtom<V>) {
    this.final || this.setFinal(this.getState());
}

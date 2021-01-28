import { Derivable, Unwrappable } from '../../interfaces';
import { unwrap } from '../unwrap';

export function flatMapMethod<V, T>(this: Derivable<V>, deriver: (value: V) => Unwrappable<T>): Derivable<T> {
    return this.map(deriver).derive(unwrap);
}

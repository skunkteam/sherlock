import type { Derivable, SettableDerivable, Unwrappable } from '../../interfaces';
import { augmentStack } from '../../utils';
import { lens } from '../factories';
import { isSettableDerivable } from '../typeguards';
import { unwrap } from '../unwrap';

export function flatMapMethod<V, T>(
    this: Derivable<V>,
    deriver: (value: V) => SettableDerivable<T>,
): SettableDerivable<T>;
export function flatMapMethod<V, T>(this: Derivable<V>, deriver: (value: V) => Unwrappable<T>): Derivable<T>;
export function flatMapMethod<V, T>(this: Derivable<V>, deriver: (value: V) => Unwrappable<T>): Derivable<T> {
    return lens<T, [Unwrappable<T>]>(
        {
            get: unwrap,
            set(value: T, base) {
                if (!isSettableDerivable(base)) {
                    throw augmentStack(new Error('The resulting Derivable from flatMap is not settable'), this);
                }
                base.set(value);
            },
        },
        this.map(deriver),
    );
}

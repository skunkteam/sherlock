import type { Derivable, Fallback, SettableDerivable } from '../../interfaces';
import { unresolved } from '../../symbols';
import { augmentStack, ErrorWrapper, FinalWrapper } from '../../utils';
import { Atom } from '../atom';
import type { BaseDerivable } from '../base-derivable';
import { derivationStackDepth } from '../derivation';
import { resolveFallback } from '../resolve-fallback';

export function valueGetter<V>(this: Derivable<V>): V | undefined {
    const state = this.getState();
    return state === unresolved || state instanceof ErrorWrapper ? undefined : state;
}

export function valueSetter<V>(this: SettableDerivable<V>, newValue: V) {
    return this.set(newValue);
}

export function getMethod<V>(this: Derivable<V>): V {
    const state = this.getState();
    if (state instanceof ErrorWrapper) {
        // Errors should be augmented at the place they originated (either catched or set).
        throw state.error;
    }
    if (state !== unresolved) {
        return state;
    }
    if (derivationStackDepth > 0) {
        throw unresolved;
    }
    throw augmentStack(new Error('Could not get value, derivable is unresolved'), this);
}

export function getOrMethod<V, T>(this: Derivable<V>, fallback: Fallback<T>): V | T {
    const state = this.getState();
    if (state instanceof ErrorWrapper) {
        throw state.error;
    }
    return state === unresolved ? resolveFallback(fallback) : state;
}

export function resolvedGetter(this: Derivable<unknown>): boolean {
    return this.getState() !== unresolved;
}

export function erroredGetter(this: Derivable<unknown>): boolean {
    return this.getState() instanceof ErrorWrapper;
}

export function errorGetter(this: Derivable<unknown>): unknown {
    const state = this.getState();
    return state instanceof ErrorWrapper ? state.error : undefined;
}

export function connected$Getter(this: BaseDerivable<unknown>): Derivable<boolean> {
    return (this._connected$ ??= new Atom(this.connected));
}

export function finalGetter(this: Derivable<unknown>): boolean {
    return this.getMaybeFinalState() instanceof FinalWrapper;
}

import { Derivable, ExcludeFalsies, RestrictToFalsies } from '../../interfaces';
import { equals } from '../../utils';
import { isDerivable } from '../typeguards';

export function andMethod<V, W>(this: Derivable<V>, other: Derivable<W> | W): Derivable<RestrictToFalsies<V> | W> {
    if (isDerivable(other)) {
        return this.derive(v => v && other.get());
    }
    return this.map(v => v && other);
}

export function orMethod<V, W>(this: Derivable<V>, other: Derivable<W> | W): Derivable<ExcludeFalsies<V> | W> {
    if (isDerivable(other)) {
        return this.derive(v => (v as ExcludeFalsies<V>) || other.get());
    }
    return this.map(v => (v as ExcludeFalsies<V>) || other);
}

export function notMethod(this: Derivable<unknown>): Derivable<boolean> {
    return this.map(v => !v);
}

export function isMethod(this: Derivable<unknown>, other: unknown): Derivable<boolean> {
    if (isDerivable(other)) {
        return this.derive(equals, other);
    }
    return this.map(v => equals(v, other));
}

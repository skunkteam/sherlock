import { equals } from './equals';

export class FinalWrapper<V> {
    static wrap<V>(value: V | FinalWrapper<V>) {
        return value instanceof FinalWrapper ? value : new FinalWrapper(value);
    }

    static unwrap<V>(value: V | FinalWrapper<V>) {
        return value instanceof FinalWrapper ? value.value : value;
    }

    static map<V, T>(value: V | FinalWrapper<V>, fn: (value: V) => T | FinalWrapper<T>): T | FinalWrapper<T> {
        return value instanceof FinalWrapper ? final(fn(value.value)) : fn(value);
    }

    private constructor(readonly value: V) {}

    equals(other: unknown) {
        return this === other || (other instanceof FinalWrapper && equals(this.value, other.value));
    }
}

export function final<V>(value: V | FinalWrapper<V>): FinalWrapper<V> {
    return FinalWrapper.wrap(value);
}

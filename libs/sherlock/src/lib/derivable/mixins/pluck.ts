import type { Derivable, SettableDerivable, Unwrappable } from '../../interfaces';
import { config } from '../../utils';
import { lens } from '../factories';
import { isDerivable } from '../typeguards';

export function pluckMethod<V>(this: Derivable<V>, key: Unwrappable<string | number>): Derivable<unknown> {
    const { get } = config.plucker;
    if (isDerivable(key)) {
        return this.derive(get, key);
    }
    return this.map(v => get.call(this, v, key));
}

export function settablePluckMethod<V>(
    this: SettableDerivable<V>,
    key: Unwrappable<string | number>,
): SettableDerivable<unknown> {
    const { get, set } = config.plucker;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const base = this;
    if (isDerivable(key)) {
        return lens({
            get() {
                return get.call(this, base.get(), key.get());
            },
            set(newValue) {
                base.set(set.call(this, newValue, base.value, key.get()));
            },
        });
    }
    return base.map(
        baseValue => get.call(this, baseValue, key),
        newValue => set.call(this, newValue, base.value, key),
    );
}

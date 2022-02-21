import type { Derivable, DerivableAtom, SettableDerivable } from '../interfaces';
import { Atom } from './atom';
import { BaseDerivable } from './base-derivable';
import { PullDataSource } from './data-source';
import { deriveMethod } from './derivation';
import { Lens } from './lens';
import { BiMapping, mapMethod, mapStateMethod } from './map';
import {
    andMethod,
    connected$Getter,
    errored$Getter,
    erroredGetter,
    errorGetter,
    fallbackToMethod,
    finalGetter,
    flatMapMethod,
    getMethod,
    getOrMethod,
    isMethod,
    makeFinalMethod,
    not$Getter,
    notMethod,
    orMethod,
    pluckMethod,
    resolved$Getter,
    resolvedGetter,
    setErrorMethod,
    setFinalMethod,
    settablePluckMethod,
    swapMethod,
    takeMethod,
    unsetMethod,
    valueGetter,
    valueSetter,
} from './mixins';

declare module './base-derivable' {
    export interface BaseDerivable<V> extends Derivable<V> {}
}
BaseDerivable.prototype.get = getMethod;
BaseDerivable.prototype.getOr = getOrMethod;
BaseDerivable.prototype.derive = deriveMethod;
BaseDerivable.prototype.map = mapMethod;
BaseDerivable.prototype.mapState = mapStateMethod;
BaseDerivable.prototype.flatMap = flatMapMethod;
BaseDerivable.prototype.pluck = pluckMethod;
BaseDerivable.prototype.fallbackTo = fallbackToMethod;
BaseDerivable.prototype.take = takeMethod;
BaseDerivable.prototype.and = andMethod;
BaseDerivable.prototype.or = orMethod;
BaseDerivable.prototype.not = notMethod;
BaseDerivable.prototype.is = isMethod;

Object.defineProperty(BaseDerivable.prototype, 'settable', { value: false });

baseDerivableGetter('value', valueGetter);
baseDerivableGetter('resolved', resolvedGetter);
baseDerivableGetter('resolved$', resolved$Getter);
baseDerivableGetter('final', finalGetter);
baseDerivableGetter('errored', erroredGetter);
baseDerivableGetter('errored$', errored$Getter);
baseDerivableGetter('error', errorGetter);
baseDerivableGetter('connected$', connected$Getter);
baseDerivableGetter('not$', not$Getter);

declare module './atom' {
    export interface Atom<V> extends DerivableAtom<V> {
        value: SettableDerivable<V>['value'];

        readonly map: DerivableAtom<V>['map'];
        readonly mapState: DerivableAtom<V>['mapState'];

        pluck: SettableDerivable<V>['pluck'];
    }
}

declare module './data-source' {
    export interface PullDataSource<V> extends SettableDerivable<V> {
        value: SettableDerivable<V>['value'];

        readonly map: SettableDerivable<V>['map'];
        readonly mapState: SettableDerivable<V>['mapState'];

        pluck: SettableDerivable<V>['pluck'];
    }
}

declare module './lens' {
    export interface Lens<V> extends SettableDerivable<V> {
        value: SettableDerivable<V>['value'];

        readonly map: SettableDerivable<V>['map'];
        readonly mapState: SettableDerivable<V>['mapState'];

        pluck: SettableDerivable<V>['pluck'];
    }
}

declare module './map' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export interface BiMapping<B, V> extends DerivableAtom<V> {
        value: SettableDerivable<V>['value'];

        readonly map: DerivableAtom<V>['map'];
        readonly mapState: DerivableAtom<V>['mapState'];

        pluck: SettableDerivable<V>['pluck'];
    }
}

[Atom, PullDataSource, BiMapping, Lens].forEach(c => {
    c.prototype.swap = swapMethod;
    c.prototype.pluck = settablePluckMethod;
    Object.defineProperty(c.prototype, 'value', { get: valueGetter, set: valueSetter });
});

[Atom, BiMapping].forEach(c => {
    c.prototype.unset = unsetMethod;
    c.prototype.setError = setErrorMethod;
    c.prototype.setFinal = setFinalMethod;
    c.prototype.makeFinal = makeFinalMethod;
});

Object.defineProperty(Lens.prototype, 'settable', { value: true });

// Use a separate functions to define getters for BaseDerivable for correct type-checking (until we get HKT in TypeScript).
function baseDerivableGetter<K extends keyof BaseDerivable<unknown>>(
    key: K,
    get: <V>(this: BaseDerivable<V>) => BaseDerivable<V>[K],
) {
    Object.defineProperty(BaseDerivable.prototype, key, { get });
}

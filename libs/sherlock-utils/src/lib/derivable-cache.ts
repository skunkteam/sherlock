import {
    atom,
    Derivable,
    derive,
    isDerivable,
    isSettableDerivable,
    lens,
    LensDescriptor,
    SettableDerivable,
    Unwrappable,
    _internal,
} from '@skunkteam/sherlock';

export interface MapImplementation<K, V> {
    set(key: K, value: V): void;
    delete(key: K): void;
    get(key: K): V | undefined;
}

export interface DerivableCacheOptions<K, V> {
    derivableFactory(key: K): Derivable<V>;
    mapFactory?(): MapImplementation<K, Derivable<V>>;
    delayedEviction?: boolean;
}

export type DerivableCache<K, V> = (key: Unwrappable<K>) => SettableDerivable<V>;

function defaultMapFactory<K, V>(): MapImplementation<K, V> {
    return new Map();
}

const CACHED_PROXY = Symbol('cachedProxy');

declare module '@skunkteam/sherlock' {
    export interface Derivable<V> {
        [CACHED_PROXY]?: SettableDerivable<V>;
    }
}

const nonFinalAtom = atom(0);

export function derivableCache<K, V>(opts: DerivableCacheOptions<K, V>): DerivableCache<K, V> {
    const cache = (opts.mapFactory || defaultMapFactory)();

    const { delayedEviction, derivableFactory } = opts;
    const descriptor: LensDescriptor<V, [K]> = {
        get(key) {
            const cachedDerivable = cache.get(key);
            // If the cache has a hit for the current key, we know it is already connected (through another proxy).
            if (cachedDerivable) {
                return cachedDerivable.getState();
            }

            // A cache miss means no other proxy is currently connected.
            const newDerivable = _internal.independentTracking(() => derivableFactory(key));
            // We don't want final-value-optimalization, because that defeats the purpose of the cache. A final value
            // is not registered as an observed value, which means we cannot track the usage of our newly created derivable.
            // Therefore introduce a non-final atom (`atom(0)`) in the derivation:
            const derivable = isSettableDerivable(newDerivable)
                ? lens<V, [number]>({ get: () => newDerivable.get(), set: v => newDerivable.set(v) }, nonFinalAtom)
                : derive(() => newDerivable.get(), nonFinalAtom);

            if (delayedEviction) {
                derivable.autoCache();
            }

            // Get the state of our derivable early so it connects when needed.
            const state = derivable.getState();
            if (derivable.connected) {
                derivable[CACHED_PROXY] = this as SettableDerivable<V>;
                cache.set(key, derivable);
                derivable.connected$.react(() => cache.delete(key), { skipFirst: true, once: true });
            }
            return state;
        },
        set(newValue, key) {
            const derivable = cache.get(key) || derivableFactory(key);
            if (!isSettableDerivable(derivable)) {
                throw _internal.augmentStack(new Error('Cached derivable is not settable'), derivable);
            }
            derivable.set(newValue);
        },
    };

    function derivableCache(key: Unwrappable<K>): SettableDerivable<V> {
        if (isDerivable(key)) {
            return key.flatMap(derivableCache);
        }
        const cacheItem = cache.get(key);
        if (cacheItem) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return cacheItem[CACHED_PROXY]!;
        }

        return lens(descriptor, key);
    }

    return derivableCache;
}

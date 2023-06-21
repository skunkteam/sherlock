import {
    atom,
    Derivable,
    isSettableDerivable,
    lens,
    LensDescriptor,
    SettableDerivable,
    _internal,
} from '@skunkteam/sherlock';

type DerivableFactory<I, V> = (input: I) => Derivable<V>;

export interface DerivableCacheOptions<I, K = I> {
    mapKeys?(key: I): K;
    delayedEviction?: boolean;
}

export interface DerivableCache<I, V, K = I> {
    (key: I): SettableDerivable<V>;
    observerCount(): number;
    connectedKeys(): IterableIterator<K>;
    connectedKeyCount(): number;
}

export function derivableCache<I, V, K = I>(
    derivableFactory: DerivableFactory<I, V>,
    { delayedEviction, mapKeys = v => v as unknown as K }: DerivableCacheOptions<I, K> = {},
): DerivableCache<I, V, K> {
    const cache = new Map<K, CacheItem<V>>();

    const injectedDependency = atom(null);

    const descriptor: LensDescriptor<V, [I, K]> = {
        get(input, key) {
            // We don't want final-value-optimalization, because that defeats the purpose of the cache. A final value
            // is not registered as an observed value, which means we cannot track the usage of our newly created derivable.
            // Therefore introduce a non-final atom (`atom(null)`) in the derivation:
            injectedDependency.get();

            const cacheEntry = cache.get(key);
            // If the cache has a hit for the current key, we know it is either already connected (through an "outer" proxy) or
            // we want to connect after initializing the inner derivable.
            if (cacheEntry) {
                return cacheEntry.inner.getState();
            }

            // A cache miss means no other proxy is currently connected. If it is a one-time get, we can simply create the
            // derivable, get the value and forget about it afterwards.
            if (!this.connected) {
                return derivableFactory(input).getState();
            }

            // Apparently we are creating a Derivable that will be connected because of a reactor or autoCache. So
            // we should now prepare the cache entry and make sure it gets removed on disconnect.
            const inner = _internal.independentTracking(() => derivableFactory(input));
            cache.set(key, { inner, outer: this });
            // We know (from before) that `this.connected`, so we just have to wait until `connected` becomes false.
            this.connected$.react((connected, stop) => {
                if (!connected) {
                    cache.delete(key);
                    stop();
                }
            });

            return inner.getState();
        },
        set(newValue, input, key) {
            const derivable = cache.get(key)?.inner ?? derivableFactory(input);
            if (!isSettableDerivable(derivable)) {
                throw _internal.augmentStack(new Error('Cached derivable is not settable'), derivable);
            }
            derivable.set(newValue);
        },
    };

    function result(input: I) {
        const cacheKey = mapKeys(input);
        const cacheEntry = cache.get(cacheKey);
        if (cacheEntry) {
            return cacheEntry.outer;
        }
        const derivable = lens(descriptor, input, cacheKey);
        delayedEviction && derivable.autoCache();
        return derivable;
    }
    result.observerCount = () => injectedDependency.observerCount;
    result.connectedKeys = () => cache.keys();
    result.connectedKeyCount = () => cache.size;
    return result;
}

interface CacheItem<V> {
    /**
     * This is the derivable as created by the derivableFactory. It should be created only once per key while connected, but
     * it will be created every time if not connected.
     */
    inner: Derivable<V>;

    /**
     * This is the returned derivable from the derivableCache when connected. Because we maintain a cache entry while connected
     * we can maintain a reference to the returned derivable which would otherwise be a memory-leak. So during connection, the
     * same derivable will be returned every time per key, otherwise a new instance (proxy) will be returned on each call.
     */
    outer: SettableDerivable<V>;
}

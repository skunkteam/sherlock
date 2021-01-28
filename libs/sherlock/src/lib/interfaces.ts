import { unresolved } from './symbols';
import { ErrorWrapper, FinalWrapper } from './utils';

/**
 * Derivable is the base interface of all variants of Sherlock Derivables.
 *
 * The base Derivable is not settable itself. SettableDerivable is a subtype of Derivable.
 */
export interface Derivable<V> {
    /**
     * Get the current value of the derivable. Throws when the derivable is in an error state or unresolved.
     */
    get(): V;

    /**
     * Get the current value of the derivable. Throws when the derivable is in an error state and returns the given fallback when the derivable
     * is unresolved.
     *
     * @param fallback fallback to use when the derivable is unresolved
     */
    getOr<T>(fallback: Fallback<T>): V | T;

    /**
     * Returns the current state, never throws.
     */
    getState(): State<V>;

    getMaybeFinalState(): MaybeFinalState<V>;

    /**
     * Returns a derivable that falls back to the given `fallback` when the current derivable is unresolved.
     *
     * @param fallback fallback to use when the derivable is unresolved
     */
    fallbackTo<T>(fallback: Fallback<T>): Derivable<V | T>;

    /**
     * Get the current value of the derivable when applicable, otherwise returns undefined (when in error state or unresolved).
     */
    readonly value: V | undefined;

    readonly resolved: boolean;

    readonly errored: boolean;

    readonly error: unknown;

    readonly final: boolean;

    readonly creationStack?: string;

    /**
     * Indicates whether the derivation is actively used to power a reactor, either directly or indirectly with other derivations in
     * between, or connected in this tick because of autoCacheMode.
     */
    readonly connected: boolean;
    readonly connected$: Derivable<boolean>;

    /** The number of current observers of this Derivable, always `0` when not connected. */
    readonly observerCount: number;
    /** The number of current dependencies of this Derivable, always `0` for atoms and for derivations when not connected. */
    readonly dependencyCount: number;

    /**
     * Indicates whether the `set()` method is implemented and whether it will accept a value.
     */
    readonly settable: boolean;

    /**
     * Create a derivation based on this Derivable and the given deriver function.
     *
     * @param f the deriver function
     */
    derive<R, PS extends unknown[]>(f: (v: V, ...ps: UnwrapTuple<PS>) => MaybeFinalState<R>, ...ps: PS): Derivable<R>;

    map<R>(f: (v: V) => MaybeFinalState<R>): Derivable<R>;
    mapState<R>(f: (v: State<V>) => MaybeFinalState<R>): Derivable<R>;

    flatMap<R>(f: (v: V) => Unwrappable<R>): Derivable<R>;

    take(options: Partial<TakeOptions<V>>): Derivable<V>;

    /**
     * Creates a derivable that has the same state, but update propagation can be pauzed based on the given `options`.
     */
    // take(options: TakeOptions<V>): Derivable<V>;

    /**
     * Create a derivation that plucks the property with the given key of the current value of the Derivable.
     *
     * @param key the key or derivable to a key that should be used to dereference the current value
     */
    pluck<K extends keyof V>(key: Unwrappable<K>): Derivable<V[K]>;
    pluck(key: Unwrappable<string | number>): Derivable<unknown>;

    /**
     * Combine this derivable with another Derivable or value using the `&&` operator on the values. Returns another Derivable.
     */
    and<W>(other: Unwrappable<W>): Derivable<RestrictToFalsies<V> | W>;

    /**
     * Combine this derivable with another Derivable or value using the `||` operator on the values. Returns another Derivable.
     */
    or<W>(other: Unwrappable<W>): Derivable<ExcludeFalsies<V> | W>;

    /**
     * Create a Derivation of this Derivable using the `!` operator on the value.
     */
    not(): Derivable<boolean>;

    /**
     * Compares the value of this Derivable to the given value or the value of the given derivable using the same `equals` rules
     * that are used for determining state changes.
     */
    is(other: Unwrappable<unknown>): Derivable<boolean>;

    /**
     * Sets this Derivable to autoCache mode. This will cache the value of this Derivable the first time {@link #get} is called every tick
     * and release this cache some time after this tick. The value is still guaranteed to be up-to-date with respect to changes in any of
     * its dependencies, by using the same mechanism that is used by a reactor. It has a setup cost comparable to starting a reactor every
     * first time #get is called per tick. Starting a reactor on a Derivable with an active and up-to-date cache is cheap though.
     */
    autoCache: <T>(this: T) => T;

    /**
     * React on changes of the this derivable. Will continue to run indefinitely until either garbage collected or limited by
     * the provided lifecycle options. Returns a callback function that can be used to stop the reactor indefinitely.
     *
     * @param reaction function to call on each reaction
     * @param options lifecycle options
     */
    react(reaction: (value: V, stop: () => void) => void, options?: Partial<ReactorOptions<V>>): () => void;

    /**
     * Returns a promise that resolves with the first value that passes the lifecycle options. Reject on any error in an upstream
     * derivable.
     *
     * @param options lifecycle options
     */
    toPromise(options?: Partial<ToPromiseOptions<V>>): Promise<V>;
}

/**
 * SettableDerivable is a Derivable that is settable. Atoms, Lenses and DataSources can be settable.
 */
export interface SettableDerivable<V> extends Derivable<V> {
    /**
     * Sets the value of this SettableDerivable, firing reactors if needed.
     *
     * @param newValue the new state
     */
    set(newValue: V): void;

    /**
     * `#value` is an alternative to the use of the `#get()` and `#set()` methods on the SettableDerivable. Getting `#value`
     * will call `#get()` and return the value. Setting `#value` will call `#set()` with the new value.
     */
    value: V | undefined;

    /**
     * Create a new Lens using the provided deriver (get) and transform (set) functions.
     *
     * @param descriptor the deriver (get) and transform (set) functions
     */
    map<R>(get: (baseValue: V) => MaybeFinalState<R>): Derivable<R>;
    map<R>(get: (baseValue: V) => MaybeFinalState<R>, set: (newValue: R, oldBaseValue?: V) => V): SettableDerivable<R>;
    mapState<R>(get: (baseState: State<V>) => MaybeFinalState<R>): Derivable<R>;
    mapState<R>(
        get: (baseState: State<V>) => MaybeFinalState<R>,
        set: (newValue: R, oldBaseState: State<V>) => V,
    ): SettableDerivable<R>;

    /**
     * Create a lens that plucks the property with the given key of the current value of the SettableDerivable.
     *
     * @param key the key or derivable to a key that should be used to dereference the current value
     */
    pluck<K extends keyof V>(key: Unwrappable<K>): SettableDerivable<V[K]>;
    pluck(key: Unwrappable<string | number>): SettableDerivable<unknown>;

    /**
     * Swaps the current value of this atom using the provided swap function. Any additional arguments to this function are
     * fed to the swap function.
     *
     * @param f the swap function
     */
    swap<PS extends unknown[]>(f: (v: V, ...ps: UnwrapTuple<PS>) => V, ...ps: PS): void;
}

export interface DerivableAtom<V> extends SettableDerivable<V> {
    set(newState: MaybeFinalState<V>): void;
    unset(): void;
    setError(err: unknown): void;
    setFinal(state: State<V>): void;
    map<R>(get: (baseValue: V) => MaybeFinalState<R>): Derivable<R>;
    map<R>(get: (baseValue: V) => MaybeFinalState<R>, set: (newValue: R, oldBaseValue?: V) => V): DerivableAtom<R>;
    mapState<R>(get: (baseState: State<V>) => MaybeFinalState<R>): Derivable<R>;
    mapState<R>(
        get: (baseState: State<V>) => MaybeFinalState<R>,
        set: (newValue: State<R>, oldBaseState: State<V>) => State<V>,
    ): DerivableAtom<R>;
}

/**
 * A description of a standalone lens with arbitrary dependencies. Can be used with the {@link lens} function
 * to create a new Lens.
 */
export interface LensDescriptor<V, PS extends unknown[] = []> {
    get(this: Derivable<V>, ...ps: PS): State<V>;
    set(this: SettableDerivable<V>, newValue: V, ...ps: PS): void;
}

export type TakeOptionValue<V> = Unwrappable<boolean> | ((d: Derivable<V>) => Unwrappable<boolean>);

/**
 * The options that can be given to the `.take()` method.
 */
export interface TakeOptions<V> {
    /**
     * Indicates when updates should start being propagated to listeners. Updates are propagated when `from` becomes true. After that `from` is
     * not observed anymore.
     */
    from: TakeOptionValue<V>;

    /**
     * Indicates when updates should not be propagated anymore. Updates will be stopped indefinitely when `until` becomes `true`.
     */
    until: TakeOptionValue<V>;

    /**
     * Indicates when updates should be propagated, starts and stops the "stream of updates" whenever the value changes. The first time
     * `when` becomes true, `skipFirst` is respected if applicable. After that updates will propagate each time `when` becomes
     * true.
     */
    when: TakeOptionValue<V>;

    /**
     * When `true` only one (not `unresolved`) update will propagate, after which it will stop indefinitely.
     */
    once: boolean;

    /**
     * When `true` only one error update will propagate, after which it will stop indefinitely.
     */
    stopOnError: boolean;

    /**
     * When `true` any observer will observe `unresolved` in place of the first resolved value. After that it has no effect (i.e. any update,
     * including `unresolved` will be observed by observers).
     */
    skipFirst: boolean;
}

/**
 * The lifecycle options that can be used when creating a new Reactor.
 */
export interface ReactorOptions<V> extends TakeOptions<V> {
    /**
     * An errorhandler that gets called when an error is thrown in any upstream derivation or the reactor itself. Any
     * error will not stop the reactor, call the provided stop callback to stop the reactor.
     */
    onError?(error: unknown, stop: () => void): void;

    /**
     * A callback that gets fired when the reactor is shutdown.
     */
    afterShutdown?(): void;
}

export type ToPromiseOptions<V> = Pick<ReactorOptions<V>, 'from' | 'until' | 'when' | 'skipFirst'>;

export type Unwrappable<T> = T | Derivable<T>;

export type Unwrap<T> = T extends Derivable<infer U> ? U : T;

export type UnwrappableTuple<T extends unknown[]> = { [K in keyof T]: Unwrappable<T[K]> };

export type UnwrapTuple<T extends Unwrappable<unknown>[]> = { [K in keyof T]: Unwrap<T[K]> };

export type Fallback<T> = Unwrappable<T> | (() => T);

export type State<V> = V | unresolved | ErrorWrapper;

export type MaybeFinalState<V> = State<V> | FinalWrapper<State<V>>;

/** Excludes all possible falsy values except NaN. */
export type ExcludeFalsies<T> = Exclude<T, false | '' | 0 | -0 | 0n | -0n | null | undefined>;

/**
 * Restrict type to only those types that can be falsy. Note that the whole `number` domain is included,
 * because NaN currently does not have a corresponding literal type.
 */
export type RestrictToFalsies<T> = T & (false | '' | number | null | undefined);

import { BaseDerivable } from '../derivable';

declare module './reactor' {
    export interface DerivableReactorExtension<V> extends Subscribable<V> {
        [Symbol.observable](): this;
        '@@observable'(): this;
    }
}

BaseDerivable.prototype.subscribe = function subscribe<V>(
    next?: PartialObserver<V> | ((value: V) => void) | null,
    error?: ((error: any) => void) | null,
    complete?: (() => void) | null,
): Unsubscribable {
    const observer = (typeof next === 'object' && next) || { next, error, complete };
    let aborted = false;
    const stopReactor = this.react(v => observer.next?.(v), {
        onError: (err, stop) => {
            aborted = true;
            stop();
            observer.error?.(err);
        },
        afterShutdown: () => aborted || observer.complete?.(),
    });
    return {
        unsubscribe: () => {
            aborted = true;
            stopReactor();
        },
    };
};

BaseDerivable.prototype['@@observable'] = function () {
    return this;
};
// istanbul ignore next
Symbol.observable && (BaseDerivable.prototype[Symbol.observable] = BaseDerivable.prototype['@@observable']);

/* RXJS INTERFACES */
interface Subscribable<T> {
    subscribe(observer?: PartialObserver<T>): Unsubscribable;
    /** @deprecated Use an observer instead of a complete callback */
    subscribe(next: null | undefined, error: null | undefined, complete: () => void): Unsubscribable;
    /** @deprecated Use an observer instead of an error callback */
    subscribe(next: null | undefined, error: (error: any) => void, complete?: () => void): Unsubscribable;
    /** @deprecated Use an observer instead of a complete callback */
    subscribe(next: (value: T) => void, error: null | undefined, complete: () => void): Unsubscribable;
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Unsubscribable;
}

interface Observer<T> {
    next: (value: T) => void;
    error: (err: any) => void;
    complete: () => void;
}

type PartialObserver<T> = { [K in keyof Observer<T>]?: Observer<T>[K] | null };

interface Unsubscribable {
    unsubscribe(): void;
}

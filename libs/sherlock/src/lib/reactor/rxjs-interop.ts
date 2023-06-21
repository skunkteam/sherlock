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
/** Symbol.observable addition */
declare global {
    interface SymbolConstructor {
        readonly observable: symbol;
    }
}

interface Subscribable<T> {
    subscribe(observer?: Partial<Observer<T>> | ((value: T) => void)): Unsubscribable;
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

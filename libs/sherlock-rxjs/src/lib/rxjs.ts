import { Derivable, ErrorWrapper, ReactorOptions } from '@skunkteam/sherlock';
import { fromEventPattern } from '@skunkteam/sherlock-utils';
import { Observable, Subscribable, Subscriber } from 'rxjs';

/**
 * Creates an RxJS Observable from a Derivable. Optionally accepts a `ReactorOptions` that governs RxJS emissions
 * and lifecycle equivalent to {@link Derivable#react} {@link ReactorOptions}.
 * @param derivable Derivable to create an RxJS Observable from.
 * @param options Partial `ReactorOptions`.
 */
export function toObservable<V>(derivable: Derivable<V>, options?: Partial<ReactorOptions<V>>): Observable<V> {
    return new Observable<V>((subscriber: Subscriber<V>) => {
        return derivable.react(value => subscriber.next(value), {
            ...options,
            afterShutdown: () => {
                subscriber.closed || subscriber.complete();
                options?.afterShutdown?.();
            },
        });
    });
}

export function fromObservable<V>(observable: Subscribable<V>): Derivable<V> {
    return fromEventPattern(value$ => {
        const subscription = observable.subscribe({
            next: value => value$.set(value),
            error: err => value$.setFinal(new ErrorWrapper(err)),
            complete: () => value$.makeFinal(),
        });
        return () => subscription.unsubscribe();
    });
}

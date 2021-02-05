import { Derivable, ErrorWrapper } from '@skunkteam/sherlock';
import { fromEventPattern } from './from-event-pattern';

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

/* RXJS INTERFACES */
interface Subscribable<T> {
    subscribe(observer?: Partial<Observer<T>>): Unsubscribable;
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Unsubscribable;
}

interface Observer<T> {
    next: (value: T) => void;
    error: (err: any) => void;
    complete: () => void;
}

interface Unsubscribable {
    unsubscribe(): void;
}

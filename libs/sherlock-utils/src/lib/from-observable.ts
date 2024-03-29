import { Derivable, error } from '@skunkteam/sherlock';
import { fromEventPattern } from './from-event-pattern';

export function fromObservable<V>(observable: Subscribable<V>): Derivable<V> {
    return fromEventPattern(value$ => {
        const subscription = observable.subscribe({
            next: value => value$.set(value),
            error: err => value$.setFinal(error(err)),
            complete: () => value$.makeFinal(),
        });
        return () => subscription.unsubscribe();
    });
}

/* RXJS INTERFACES */
interface Subscribable<T> {
    subscribe(observer?: Partial<Observer<T>> | ((value: T) => void)): Unsubscribable;
}

interface Observer<T> {
    next: (value: T) => void;
    error: (err: any) => void;
    complete: () => void;
}

interface Unsubscribable {
    unsubscribe(): void;
}

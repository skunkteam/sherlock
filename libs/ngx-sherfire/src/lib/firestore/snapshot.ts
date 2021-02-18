import type { NgZone } from '@angular/core';
import { Derivable, error } from '@skunkteam/sherlock';
import { fromEventPattern } from '@skunkteam/sherlock-utils';
import type firebase from 'firebase/app';

export function snapshot$<R extends Ref>(ref: R & Snapshottable<R>, zone: NgZone): Derivable<Snapshot<R>> {
    return fromEventPattern<Snapshot<R>>(value$ =>
        ref.onSnapshot(
            snap => zone.run(() => value$.set(snap)),
            // istanbul ignore next, because I don't know how to force that to happen
            err => zone.run(() => value$.setFinal(error(err))),
            // istanbul ignore next, because I don't know how to force that to happen
            () => zone.run(() => value$.makeFinal()),
        ),
    );
}

type Ref = firebase.firestore.DocumentReference | firebase.firestore.Query;
type Snapshot<R extends Ref> = ReturnType<R['get']> extends PromiseLike<infer S> ? S : never;

// Need this due to problems with the Ref Union on the `onSnapshot` method
type Snapshottable<R extends Ref> = {
    onSnapshot(next: (snap: Snapshot<R>) => void, error?: (error: Error) => void, complete?: () => void): () => void;
};

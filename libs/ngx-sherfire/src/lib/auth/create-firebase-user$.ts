import type { NgZone } from '@angular/core';
import { error, unresolved } from '@skunkteam/sherlock';
import { fromEventPattern, fromPromise } from '@skunkteam/sherlock-utils';
import type firebase from 'firebase/app';
import type { FirebaseAuth } from './firebase-auth.service';
import type { FirebaseUser$ } from './firebase-user$.service';

export function createFirebaseUser$(zone: NgZone, auth: FirebaseAuth): FirebaseUser$ {
    // Wrapped in an object to allow Firebase to reuse the User object (which they do).
    return fromEventPattern<{ user: firebase.User | null }>(value$ =>
        auth.onIdTokenChanged(
            user => zone.run(() => value$.set({ user })),
            err => zone.run(() => value$.setFinal(error(err))),
            () => zone.run(() => value$.makeFinal()),
        ),
    )
        .fallbackTo(() => (auth.currentUser ? { user: auth.currentUser } : unresolved))
        .flatMap(({ user }) => user && fromPromise(user.getIdTokenResult().then(idtoken => ({ user, idtoken }))));
}

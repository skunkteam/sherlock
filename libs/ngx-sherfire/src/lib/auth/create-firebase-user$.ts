import type { NgZone } from '@angular/core';
import { error, unresolved } from '@skunkteam/sherlock';
import { fromEventPattern, fromPromise } from '@skunkteam/sherlock-utils';
import type firebase from 'firebase';
import type { FirebaseAuth } from './firebase-auth.service';
import type { FirebaseUser$ } from './firebase-user$.service';

export function createFirebaseUser$(zone: NgZone, auth: FirebaseAuth): FirebaseUser$ {
    return fromEventPattern<firebase.User | null>(value$ =>
        auth.onIdTokenChanged(
            user => zone.run(() => value$.set(user)),
            err => zone.run(() => value$.setFinal(error(err))),
            () => zone.run(() => value$.makeFinal()),
        ),
    )
        .fallbackTo(() => auth.currentUser ?? unresolved)
        .flatMap(user => user && fromPromise(user.getIdTokenResult().then(idtoken => ({ user, idtoken }))));
}

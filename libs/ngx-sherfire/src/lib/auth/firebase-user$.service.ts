import { inject, Injectable, NgZone } from '@angular/core';
import { error, unresolved, type Derivable } from '@skunkteam/sherlock';
import { fromEventPattern, fromPromise } from '@skunkteam/sherlock-utils';
import type { IdTokenResult, User } from 'firebase/auth';
import { NgxSherfireModule } from '../ngx-sherfire.module';
import { SherfireAuth } from './sherfire-auth.service';

export interface FirebaseUser$ extends Derivable<{ user: User; idtoken: IdTokenResult } | null> {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: () => {
        const auth = inject(SherfireAuth);
        const zone = inject(NgZone);
        // Wrapped in an object to allow Firebase to reuse the User object (which they do).
        return fromEventPattern<{ user: User | null }>(value$ =>
            auth.onIdTokenChanged(
                user => zone.run(() => value$.set({ user })),
                err => zone.run(() => value$.setFinal(error(err))),
                () => zone.run(() => value$.makeFinal()),
            ),
        )
            .fallbackTo(() => (auth.currentUser ? { user: auth.currentUser } : unresolved))
            .flatMap(({ user }) => user && fromPromise(user.getIdTokenResult().then(idtoken => ({ user, idtoken }))));
    },
})
export class FirebaseUser$ {}

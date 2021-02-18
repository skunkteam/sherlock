import { inject, Injectable, NgZone } from '@angular/core';
import type { Derivable } from '@skunkteam/sherlock';
import type firebase from 'firebase/app';
import { NgxSherfireModule } from '../ngx-sherfire.module';
import { createFirebaseUser$ } from './create-firebase-user$';
import { FirebaseAuth } from './firebase-auth.service';

export interface FirebaseUser$
    extends Derivable<{ user: firebase.User; idtoken: firebase.auth.IdTokenResult } | null> {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: firebaseUser$Factory,
})
export class FirebaseUser$ {}

export function firebaseUser$Factory(): FirebaseUser$ {
    return createFirebaseUser$(inject(NgZone), inject(FirebaseAuth));
}

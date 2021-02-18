import { inject, Injectable, NgZone } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import { FirebaseApp } from '../app';
import { NgxSherfireModule } from '../ngx-sherfire.module';

export interface FirebaseAuth extends firebase.auth.Auth {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: firebaseAuthFactory,
})
export class FirebaseAuth {
    static readonly Persistence = firebase.auth.Auth.Persistence;
}
export namespace FirebaseAuth {
    export type Persistence = firebase.auth.Auth.Persistence;
}

export function firebaseAuthFactory(): FirebaseAuth {
    return inject(NgZone).runOutsideAngular(createAuth);
}

export function createAuth() {
    return inject(FirebaseApp).auth();
}

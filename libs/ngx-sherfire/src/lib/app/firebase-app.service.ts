import { inject, Injectable, NgZone } from '@angular/core';
import firebase from 'firebase/app';
import { FirebaseConfig } from '../firebase-config.service';
import { NgxSherfireModule } from '../ngx-sherfire.module';

export interface FirebaseApp extends firebase.app.App {}
@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: firebaseAppFactory,
})
export class FirebaseApp {}

export function firebaseAppFactory(): FirebaseApp {
    return inject(NgZone).runOutsideAngular(initializeApp);
}

export function initializeApp() {
    return firebase.initializeApp(inject(FirebaseConfig));
}

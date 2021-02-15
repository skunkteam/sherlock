import { Injectable } from '@angular/core';
import type firebase from 'firebase';

@Injectable()
export class FirebaseConfig {
    apiKey!: string;
    authDomain!: string;
    databaseURL!: string;
    projectId!: string;
    // locationId: string;
    storageBucket!: string;
    messagingSenderId!: string;
    appId!: string;

    firestoreSettings?: firebase.firestore.Settings;
    firestoreEmulator?: { host: string; port: number };

    // istanbul ignore next
    private constructor() {
        // this class should not be constructed directly
    }
}

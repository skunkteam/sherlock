import type firebase from 'firebase/app';

export abstract class FirebaseConfig {
    abstract apiKey: string;
    abstract authDomain: string;
    abstract databaseURL: string;
    abstract projectId: string;
    // locationId: string;
    abstract storageBucket: string;
    abstract messagingSenderId: string;
    abstract appId: string;

    abstract firestoreSettings?: firebase.firestore.Settings;
    abstract firestoreEmulator?: { host: string; port: number };
}

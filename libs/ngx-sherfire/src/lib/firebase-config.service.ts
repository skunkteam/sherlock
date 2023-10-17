import type { FirebaseAppSettings, FirebaseOptions } from 'firebase/app';
import type { FirestoreSettings } from 'firebase/firestore';

export abstract class FirebaseConfig {
    abstract firestoreSettings?: FirestoreSettings;
    abstract firestoreEmulator?: { host: string; port: number };
    abstract appSettings?: FirebaseAppSettings;
}
export interface FirebaseConfig extends FirebaseOptions {}

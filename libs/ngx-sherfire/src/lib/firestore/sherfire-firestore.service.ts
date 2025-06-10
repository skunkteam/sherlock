import { inject, Injectable, NgZone } from '@angular/core';
import type { Firestore } from 'firebase/firestore';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { SherfireApp } from '../app';
import { FirebaseConfig } from '../firebase-config.service';
import { NgxSherfireModule } from '../ngx-sherfire.module';

export interface SherfireFirestore extends Firestore {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: () =>
        inject(NgZone).runOutsideAngular(() => {
            const { firestoreEmulator, firestoreDatabaseId, firestoreSettings } = inject(FirebaseConfig);
            const firestore = initializeFirestore(inject(SherfireApp), firestoreSettings ?? {}, firestoreDatabaseId);
            if (firestoreEmulator) {
                connectFirestoreEmulator(firestore, firestoreEmulator.host, firestoreEmulator.port);
            }
            return firestore;
        }),
})
export abstract class SherfireFirestore {}

import { inject, Injectable, NgZone } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { FirebaseApp } from '../app';
import { FirebaseConfig } from '../firebase-config.service';
import { NgxSherfireModule } from '../ngx-sherfire.module';
import {
    AugmentedCollectionReference,
    AugmentedDocumentReference,
    AugmentedDocumentSnapshot,
    AugmentedFirestore,
    AugmentedQuery,
    AugmentedQueryDocumentSnapshot,
    AugmentedTransaction,
    augmentFirestorePrototypes,
} from './augment-prototypes';

export interface FirebaseFirestore extends AugmentedFirestore {}

@Injectable({
    providedIn: NgxSherfireModule,
    useFactory: firebaseFirestoreFactory,
})
export class FirebaseFirestore {
    static readonly Blob = firebase.firestore.Blob;
    static readonly CollectionReference = firebase.firestore.CollectionReference;
    static readonly DocumentReference = firebase.firestore.DocumentReference;
    static readonly DocumentSnapshot = firebase.firestore.DocumentSnapshot;
    static readonly FieldPath = firebase.firestore.FieldPath;
    static readonly FieldValue = firebase.firestore.FieldValue;
    static readonly GeoPoint = firebase.firestore.GeoPoint;
    static readonly Query = firebase.firestore.Query;
    static readonly QueryDocumentSnapshot = firebase.firestore.QueryDocumentSnapshot;
    static readonly QuerySnapshot = firebase.firestore.QuerySnapshot;
    static readonly Timestamp = firebase.firestore.Timestamp;
    static readonly Transaction = firebase.firestore.Transaction;
    static readonly WriteBatch = firebase.firestore.WriteBatch;
}
export namespace FirebaseFirestore {
    export type Blob = firebase.firestore.Blob;
    export type CollectionReference<T = DocumentData> = AugmentedCollectionReference<T>;
    export type DocumentChange<T = DocumentData> = firebase.firestore.DocumentChange<T>;
    export type DocumentChangeType = firebase.firestore.DocumentChangeType;
    export type DocumentData = firebase.firestore.DocumentData;
    export type DocumentReference<T = DocumentData> = AugmentedDocumentReference<T>;
    export type DocumentSnapshot = AugmentedDocumentSnapshot;
    export type FieldPath = firebase.firestore.FieldPath;
    export type FieldValue = firebase.firestore.FieldValue;
    export type FirestoreDataConverter<T> = firebase.firestore.FirestoreDataConverter<T>;
    export type FirestoreError = firebase.firestore.FirestoreError;
    export type FirestoreErrorCode = firebase.firestore.FirestoreErrorCode;
    export type GeoPoint = firebase.firestore.GeoPoint;
    export type GetOptions = firebase.firestore.GetOptions;
    export type LoadBundleTask = firebase.firestore.LoadBundleTask;
    export type LoadBundleTaskProgress = firebase.firestore.LoadBundleTaskProgress;
    export type LogLevel = firebase.firestore.LogLevel;
    export type OrderByDirection = firebase.firestore.OrderByDirection;
    export type PersistenceSettings = firebase.firestore.PersistenceSettings;
    export type Query<T = DocumentData> = AugmentedQuery<T>;
    export type QueryDocumentSnapshot<T = DocumentData> = AugmentedQueryDocumentSnapshot<T>;
    export type QuerySnapshot<T = DocumentData> = firebase.firestore.QuerySnapshot<T>;
    export type SetOptions = firebase.firestore.SetOptions;
    export type Settings = firebase.firestore.Settings;
    export type SnapshotListenOptions = firebase.firestore.SnapshotListenOptions;
    export type SnapshotMetadata = firebase.firestore.SnapshotMetadata;
    export type SnapshotOptions = firebase.firestore.SnapshotOptions;
    export type TaskState = firebase.firestore.TaskState;
    export type Timestamp = firebase.firestore.Timestamp;
    export type Transaction = AugmentedTransaction;
    export type UpdateData = firebase.firestore.UpdateData;
    export type WhereFilterOp = firebase.firestore.WhereFilterOp;
    export type WriteBatch = firebase.firestore.WriteBatch;
}

export function firebaseFirestoreFactory() {
    const zone = inject(NgZone);
    augmentFirestorePrototypes(zone);
    return zone.runOutsideAngular(() => {
        const firestore = inject(FirebaseApp).firestore();
        const { firestoreEmulator, firestoreSettings } = inject(FirebaseConfig);
        firestoreSettings && firestore.settings(firestoreSettings);
        firestoreEmulator && firestore.useEmulator(firestoreEmulator.host, firestoreEmulator.port);
        return firestore;
    });
}

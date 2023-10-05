import { Injectable, NgZone } from '@angular/core';
import { Derivable, DerivableAtom, SettableDerivable, error, lens } from '@skunkteam/sherlock';
import { DerivableCacheOptions, derivableCache, fromEventPattern } from '@skunkteam/sherlock-utils';
import {
    CollectionReference,
    DocumentData,
    DocumentReference,
    DocumentSnapshot,
    FirestoreError,
    Query,
    QueryDocumentSnapshot,
    QuerySnapshot,
    onSnapshot,
    setDoc,
} from 'firebase/firestore';
import { NgxSherfireModule } from '../ngx-sherfire.module';

@Injectable({ providedIn: NgxSherfireModule })
export class DerivableFirestore {
    constructor(private readonly zone: NgZone) {}

    /**
     * Build a derivable based on a Query or CollectionReference that returns a stream of updated QuerySnapshots that contain all
     * QueryDocumentSnapshots matching the query.
     */
    snapshot$<App, Db extends DocumentData>(query: Query<App, Db>): Derivable<QuerySnapshot<App, Db>>;
    /**
     * Build a derivable based on a DocumentReference that returns a stream of updated DocumentSnapshots.
     */
    snapshot$<App, Db extends DocumentData>(ref: DocumentReference<App, Db>): Derivable<DocumentSnapshot<App, Db>>;
    snapshot$<App, Db extends DocumentData>(
        v: DocumentReference<App, Db> | Query<App, Db>,
    ): Derivable<DocumentSnapshot<App, Db>> | Derivable<QuerySnapshot<App, Db>> {
        return v instanceof DocumentReference
            ? this.CACHES.doc.snapshot(v)
            : v instanceof CollectionReference
            ? this.CACHES.collection.snapshot(v)
            : this.querySnapshot$(v);
    }

    /**
     * Build a derivable based on a Query or CollectionReference that returns a stream of updates with an array of QueryDocumentSnapshot.
     */
    docs$<App, Db extends DocumentData>(query: Query<App, Db>): Derivable<Array<QueryDocumentSnapshot<App, Db>>> {
        return query instanceof CollectionReference ? this.CACHES.collection.docs(query) : this.queryDocs$(query);
    }

    /**
     * Build a derivable based on a Query or CollectionReference that returns a stream of arrays of document contents.
     */
    data$<App, Db extends DocumentData>(query: Query<App, Db>): Derivable<App[]>;
    /**
     * Build a derivable based on a DocumentReference that returns a stream of document contents. The returned derivable is settable and
     * setting a value to the derivable will update the firestore document.
     */
    data$<App, Db extends DocumentData>(ref: DocumentReference<App, Db>): SettableDerivable<App>;
    data$<App, Db extends DocumentData>(
        v: DocumentReference<App, Db> | Query<App, Db>,
    ): SettableDerivable<App> | Derivable<App[]> {
        return v instanceof DocumentReference
            ? this.CACHES.doc.data(v)
            : v instanceof CollectionReference
            ? this.CACHES.collection.data(v)
            : this.queryData$(v);
    }

    private readonly CACHES = this.buildCaches();

    private querySnapshot$<AppModelType, DbModelType extends DocumentData>(
        query: Query<AppModelType, DbModelType>,
    ): Derivable<QuerySnapshot<AppModelType, DbModelType>> {
        return fromEventPattern<QuerySnapshot<AppModelType, DbModelType>>(value$ =>
            onSnapshot(query, ...this.snapshotEventHandlers(value$)),
        );
    }

    private docSnapshot$<AppModelType, DbModelType extends DocumentData>(
        ref: DocumentReference<AppModelType, DbModelType>,
    ): Derivable<DocumentSnapshot<AppModelType, DbModelType>> {
        return fromEventPattern<DocumentSnapshot<AppModelType, DbModelType>>(value$ =>
            onSnapshot(ref, ...this.snapshotEventHandlers(value$)),
        );
    }

    private snapshotEventHandlers<T>(value$: DerivableAtom<T>) {
        return [
            (snap: T) => this.zone.run(() => value$.set(snap)),
            // istanbul ignore next, because I don't know how to force that to happen
            (err: FirestoreError) => this.zone.run(() => value$.setFinal(error(err))),
        ] as const;
    }

    private queryDocs$<AppModelType, DbModelType extends DocumentData>(
        query: Query<AppModelType, DbModelType>,
    ): Derivable<Array<QueryDocumentSnapshot<AppModelType, DbModelType>>> {
        return this.snapshot$(query).map(s => s.docs);
    }

    private queryData$<AppModelType, DbModelType extends DocumentData>(
        query: Query<AppModelType, DbModelType>,
    ): Derivable<AppModelType[]> {
        return this.docs$(query).map(snaps => snaps.map(snap => snap.data()));
    }

    private buildCaches() {
        const CACHE_OPTIONS: DerivableCacheOptions<
            DocumentReference<any, any> | CollectionReference<any, any>,
            string
        > = {
            delayedEviction: true,
            mapKeys: v => v.path,
        };

        return {
            collection: {
                snapshot: derivableCache(
                    (ref: CollectionReference<any, any>) => this.querySnapshot$(ref),
                    CACHE_OPTIONS,
                ),
                docs: derivableCache((ref: CollectionReference<any, any>) => this.queryDocs$(ref), CACHE_OPTIONS),
                data: derivableCache((ref: CollectionReference<any, any>) => this.queryData$(ref), CACHE_OPTIONS),
            },
            doc: {
                snapshot: derivableCache((ref: DocumentReference<any, any>) => this.docSnapshot$(ref), CACHE_OPTIONS),
                data: derivableCache(
                    (ref: DocumentReference<any, any>) =>
                        lens({
                            get: () => this.snapshot$(ref).get().data(),
                            set: newValue => newValue != null && setDoc(ref, newValue),
                        }),
                    CACHE_OPTIONS,
                ),
            },
        } as const;
    }
}

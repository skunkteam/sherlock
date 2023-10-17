import { Injectable, NgZone } from '@angular/core';
import { Derivable, SettableDerivable, Unwrap, error, lens } from '@skunkteam/sherlock';
import { fromEventPattern } from '@skunkteam/sherlock-utils';
import {
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
     * Build a derivable based on a Query or CollectionReference that updates with a QuerySnapshot (that contains all
     * QueryDocumentSnapshots matching the query) whenever the QuerySnapshot changes server side.
     */
    snapshot$<AppType, DbType extends DocumentData>(
        query: Query<AppType, DbType>,
    ): Derivable<QuerySnapshot<AppType, DbType>>;
    /**
     * Build a derivable based on a DocumentReference that updates with a DocumentSnapshot whenever the snapshot changes server side.
     */
    snapshot$<AppType, DbType extends DocumentData>(
        ref: DocumentReference<AppType, DbType>,
    ): Derivable<DocumentSnapshot<AppType, DbType>>;
    snapshot$<AppType, DbType extends DocumentData>(
        refOrQuery: DocumentReference<AppType, DbType> | Query<AppType, DbType>,
    ): Derivable<DocumentSnapshot<AppType, DbType> | QuerySnapshot<AppType, DbType>> {
        return fromEventPattern(v$ => {
            const onNext = (snap: Unwrap<typeof v$>) => this.zone.run(() => v$.set(snap));
            // istanbul ignore next, because I don't know how to force that to happen
            const onError = (err: FirestoreError) => this.zone.run(() => v$.setFinal(error(err)));
            // `onSnapshot` doesn't have a merged signature that accepts both `DocumentReference`s and `Query`s. The following ternary
            // expression is obviously unnecessary at runtime, but this is the safest way to make sure that we get warned by TypeScript
            // if the signature of `onSnapshot` gets changed in a future release.
            return refOrQuery instanceof DocumentReference
                ? onSnapshot(refOrQuery, onNext, onError)
                : onSnapshot(refOrQuery, onNext, onError);
        });
    }

    /**
     * Build a derivable based on a Query or CollectionReference that updates with an array of QueryDocumentSnapshot whenever the
     * QuerySnapshot changes server side.
     */
    docs$<AppType, DbType extends DocumentData>(
        query: Query<AppType, DbType>,
    ): Derivable<Array<QueryDocumentSnapshot<AppType, DbType>>> {
        return this.snapshot$(query).map(s => s.docs);
    }

    /**
     * Build a derivable based on a Query or CollectionReference that updates with an array of document contents whenever the
     * QuerySnapshot changes server side.
     */
    data$<AppType, DbType extends DocumentData>(query: Query<AppType, DbType>): Derivable<AppType[]>;
    /**
     * Build a derivable based on a DocumentReference that updates with the document contents whenever the snapshot changes server side. The
     * returned derivable is settable and setting a (non undefined) value to the derivable will update the firestore document server side.
     */
    data$<AppType, DbType extends DocumentData>(
        ref: DocumentReference<AppType, DbType>,
    ): SettableDerivable<AppType | undefined>;
    data$<AppType, DbType extends DocumentData>(
        v: DocumentReference<AppType, DbType> | Query<AppType, DbType>,
    ): SettableDerivable<AppType | undefined> | Derivable<AppType[]> {
        if (v instanceof DocumentReference) {
            const snapshot$ = this.snapshot$(v);
            return lens({
                get: () => snapshot$.get().data(),
                set: newValue => newValue != null && setDoc(v, newValue),
            });
        }
        return this.snapshot$(v).map(s => s.docs.map(d => d.data()));
    }
}

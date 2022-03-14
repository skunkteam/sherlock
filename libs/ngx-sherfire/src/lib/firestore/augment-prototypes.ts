import type { NgZone } from '@angular/core';
import { Derivable, lens, SettableDerivable } from '@skunkteam/sherlock';
import { derivableCache } from '@skunkteam/sherlock-utils';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { snapshot$ } from './snapshot';

export function augmentFirestorePrototypes(zone: NgZone) {
    augmentQueries(zone);
    augmentDocuments(zone);
}

const cacheOptions = { delayedEviction: true, mapKeys } as const;

function augmentDocuments(zone: NgZone) {
    const documentSnapshot$Cache = derivableCache(
        (ref: AugmentedDocumentReference) => snapshot$(ref, zone),
        cacheOptions,
    );
    const documentData$Cache = derivableCache(
        (ref: AugmentedDocumentReference) =>
            lens({
                get: () => ref.snapshot$.get().data(),
                set: newValue => newValue != null && ref.set(newValue),
            }),
        cacheOptions,
    );
    Object.defineProperties(firebase.firestore.DocumentReference.prototype, {
        snapshot$: {
            configurable: true,
            get(this: AugmentedDocumentReference) {
                return (this._snapshot$ ??= documentSnapshot$Cache(this));
            },
        },
        data$: {
            configurable: true,
            get(this: AugmentedDocumentReference) {
                return (this._data$ ??= documentData$Cache(this));
            },
        },
    });
}

function augmentQueries(zone: NgZone) {
    const collectionSnapshot$Cache = derivableCache(
        (ref: AugmentedCollectionReference) => snapshot$(ref, zone),
        cacheOptions,
    );
    const collectionDocs$Cache = derivableCache(createDocs$, cacheOptions);
    const collectionData$Cache = derivableCache(createData$, cacheOptions);
    Object.defineProperties(firebase.firestore.Query.prototype, {
        snapshot$: {
            configurable: true,
            get(this: AugmentedQuery | AugmentedCollectionReference) {
                return (this._snapshot$ ??= 'path' in this ? collectionSnapshot$Cache(this) : snapshot$(this, zone));
            },
        },
        docs$: {
            configurable: true,
            get(this: AugmentedQuery | AugmentedCollectionReference) {
                return (this._docs$ ??= 'path' in this ? collectionDocs$Cache(this) : createDocs$(this));
            },
        },
        data$: {
            configurable: true,
            get(this: AugmentedQuery | AugmentedCollectionReference) {
                return (this._data$ ??= 'path' in this ? collectionData$Cache(this) : createData$(this));
            },
        },
    });
}

function createDocs$(ref: AugmentedQuery | AugmentedCollectionReference) {
    return ref.snapshot$.map(s => s.docs);
}

function createData$(ref: AugmentedQuery | AugmentedCollectionReference) {
    return ref.snapshot$.map(s => s.docs.map(d => d.data()));
}

function mapKeys<T extends { firestore: AugmentedFirestore; path?: string }>(ref: T): T | string {
    // istanbul ignore next, is only for type-safety, the fallback to ref is not really used
    return ref.path ?? ref;
}

export interface ExtraQueryProps<T = firebase.firestore.DocumentData> {
    /** A Derivable of the (single) QuerySnapshot resulting from this Query. */
    snapshot$: Derivable<AugmentedQuerySnapshot<T>>;
    /** A Derivable of the (multiple) QueryDocumentSnapshots representing the found documents. */
    docs$: Derivable<Array<AugmentedQueryDocumentSnapshot<T>>>;
    /** A Derivable of the found documents in this Query. */
    data$: Derivable<T[]>;

    /** @internal */
    _snapshot$?: Derivable<AugmentedQuerySnapshot<T>>;
    /** @internal */
    _docs$?: Derivable<Array<AugmentedQueryDocumentSnapshot<T>>>;
    /** @internal */
    _data$?: Derivable<T[]>;
}

export interface ExtraDocumentProps<T = firebase.firestore.DocumentData> {
    /** A Derivable of the snapshot that is found at this path. */
    snapshot$: Derivable<AugmentedDocumentSnapshot<T>>;
    /** A Derivable of the document data (if found) at this path. */
    data$: SettableDerivable<T | undefined>;

    /** @internal */
    _snapshot$: Derivable<AugmentedDocumentSnapshot<T>>;
    /** @internal */
    _data$: SettableDerivable<T | undefined>;
}

// START WORKAROUND FOR: https://github.com/Microsoft/TypeScript/issues/14080
// Augmentation of interfaces is not possible when only a default export is provided.

export interface AugmentedFirestore extends firebase.firestore.Firestore {
    /**
     * Gets a `CollectionReference` instance that refers to the collection at
     * the specified path.
     *
     * @param collectionPath A slash-separated path to a collection.
     * @return The `CollectionReference` instance.
     */
    collection(collectionPath: string): AugmentedCollectionReference<firebase.firestore.DocumentData>;

    /**
     * Gets a `DocumentReference` instance that refers to the document at the
     * specified path.
     *
     * @param documentPath A slash-separated path to a document.
     * @return The `DocumentReference` instance.
     */
    doc(documentPath: string): AugmentedDocumentReference<firebase.firestore.DocumentData>;

    /**
     * Creates and returns a new Query that includes all documents in the
     * database that are contained in a collection or subcollection with the
     * given collectionId.
     *
     * @param collectionId Identifies the collections to query over. Every
     * collection or subcollection with this ID as the last segment of its path
     * will be included. Cannot contain a slash.
     * @return The created Query.
     */
    collectionGroup(collectionId: string): AugmentedQuery<firebase.firestore.DocumentData>;

    /**
     * Executes the given `updateFunction` and then attempts to commit the changes
     * applied within the transaction. If any document read within the transaction
     * has changed, Cloud Firestore retries the `updateFunction`. If it fails to
     * commit after 5 attempts, the transaction fails.
     *
     * The maximum number of writes allowed in a single transaction is 500, but
     * note that each usage of `FieldValue.serverTimestamp()`,
     * `FieldValue.arrayUnion()`, `FieldValue.arrayRemove()`, or
     * `FieldValue.increment()` inside a transaction counts as an additional write.
     *
     * @param updateFunction
     *   The function to execute within the transaction context.
     *
     * @return
     *   If the transaction completed successfully or was explicitly aborted
     *   (the `updateFunction` returned a failed promise),
     *   the promise returned by the updateFunction is returned here. Else, if the
     *   transaction failed, a rejected promise with the corresponding failure
     *   error will be returned.
     */
    runTransaction<T>(updateFunction: (transaction: AugmentedTransaction) => Promise<T>): Promise<T>;
}

export interface AugmentedDocumentReference<T = firebase.firestore.DocumentData>
    extends firebase.firestore.DocumentReference<T>,
        ExtraDocumentProps<T> {
    /**
     * The {@link firebase.firestore.Firestore} the document is in.
     * This is useful for performing transactions, for example.
     */
    readonly firestore: AugmentedFirestore;

    /**
     * The Collection this `DocumentReference` belongs to.
     */
    readonly parent: AugmentedCollectionReference<T>;

    /**
     * Gets a `CollectionReference` instance that refers to the collection at
     * the specified path.
     *
     * @param collectionPath A slash-separated path to a collection.
     * @return The `CollectionReference` instance.
     */
    collection(collectionPath: string): AugmentedCollectionReference<firebase.firestore.DocumentData>;

    /**
     * Reads the document referred to by this `DocumentReference`.
     *
     * Note: By default, get() attempts to provide up-to-date data when possible
     * by waiting for data from the server, but it may return cached data or fail
     * if you are offline and the server cannot be reached. This behavior can be
     * altered via the `GetOptions` parameter.
     *
     * @param options An object to configure the get behavior.
     * @return A Promise resolved with a DocumentSnapshot containing the
     * current document contents.
     */
    get(options?: firebase.firestore.GetOptions): Promise<AugmentedDocumentSnapshot<T>>;

    /**
     * Attaches a listener for DocumentSnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param observer A single object containing `next` and `error` callbacks.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(observer: {
        next?: (snapshot: AugmentedDocumentSnapshot<T>) => void;
        error?: (error: firebase.firestore.FirestoreError) => void;
        complete?: () => void;
    }): () => void;
    /**
     * Attaches a listener for DocumentSnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param options Options controlling the listen behavior.
     * @param observer A single object containing `next` and `error` callbacks.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        observer: {
            next?: (snapshot: AugmentedDocumentSnapshot<T>) => void;
            error?: (error: firebase.firestore.FirestoreError) => void;
            complete?: () => void;
        },
    ): () => void;
    /**
     * Attaches a listener for DocumentSnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param onNext A callback to be called every time a new `DocumentSnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        onNext: (snapshot: AugmentedDocumentSnapshot<T>) => void,
        onError?: (error: firebase.firestore.FirestoreError) => void,
        onCompletion?: () => void,
    ): () => void;
    /**
     * Attaches a listener for DocumentSnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param options Options controlling the listen behavior.
     * @param onNext A callback to be called every time a new `DocumentSnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        onNext: (snapshot: AugmentedDocumentSnapshot<T>) => void,
        onError?: (error: firebase.firestore.FirestoreError) => void,
        onCompletion?: () => void,
    ): () => void;

    /**
     * Applies a custom data converter to this DocumentReference, allowing you
     * to use your own custom model objects with Firestore. When you call
     * set(), get(), etc. on the returned DocumentReference instance, the
     * provided converter will convert between Firestore data and your custom
     * type U.
     *
     * Passing in `null` as the converter parameter removes the current
     * converter.
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A DocumentReference<U> that uses the provided converter.
     */
    withConverter(converter: null): AugmentedDocumentReference<firebase.firestore.DocumentData>;
    /**
     * Applies a custom data converter to this DocumentReference, allowing you
     * to use your own custom model objects with Firestore. When you call
     * set(), get(), etc. on the returned DocumentReference instance, the
     * provided converter will convert between Firestore data and your custom
     * type U.
     *
     * @param converter Converts objects to and from Firestore.
     * @return A DocumentReference<U> that uses the provided converter.
     */
    withConverter<U>(converter: firebase.firestore.FirestoreDataConverter<U>): AugmentedDocumentReference<U>;
}

export interface AugmentedCollectionReference<T = firebase.firestore.DocumentData>
    extends firebase.firestore.CollectionReference<T>,
        ExtraQueryProps<T> {
    /**
     * The `Firestore` for the Firestore database (useful for performing
     * transactions, etc.).
     */
    readonly firestore: AugmentedFirestore;

    /**
     * Creates and returns a new Query with the additional filter that documents
     * must contain the specified field and the value should satisfy the
     * relation constraint provided.
     *
     * @param fieldPath The path to compare
     * @param opStr The operation string (e.g "<", "<=", "==", ">", ">=").
     * @param value The value for comparison
     * @return The created Query.
     */
    where(
        fieldPath: string | firebase.firestore.FieldPath,
        opStr: firebase.firestore.WhereFilterOp,
        value: any,
    ): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that's additionally sorted by the
     * specified field, optionally in descending order instead of ascending.
     *
     * @param fieldPath The field to sort by.
     * @param directionStr Optional direction to sort by (`asc` or `desc`). If
     * not specified, order will be ascending.
     * @return The created Query.
     */
    orderBy(
        fieldPath: string | firebase.firestore.FieldPath,
        directionStr?: firebase.firestore.OrderByDirection,
    ): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that only returns the first matching
     * documents.
     *
     * @param limit The maximum number of items to return.
     * @return The created Query.
     */
    limit(limit: number): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that only returns the last matching
     * documents.
     *
     * You must specify at least one `orderBy` clause for `limitToLast` queries,
     * otherwise an exception will be thrown during execution.
     *
     * @param limit The maximum number of items to return.
     * @return The created Query.
     */
    limitToLast(limit: number): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts at the provided document
     * (inclusive). The starting position is relative to the order of the query.
     * The document must contain all of the fields provided in the `orderBy` of
     * this query.
     *
     * @param snapshot The snapshot of the document to start at.
     * @return The created Query.
     */
    startAt(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts at the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to start this query at, in order
     * of the query's order by.
     * @return The created Query.
     */
    startAt(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts after the provided document
     * (exclusive). The starting position is relative to the order of the query.
     * The document must contain all of the fields provided in the orderBy of
     * this query.
     *
     * @param snapshot The snapshot of the document to start after.
     * @return The created Query.
     */
    startAfter(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts after the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to start this query after, in order
     * of the query's order by.
     * @return The created Query.
     */
    startAfter(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends before the provided document
     * (exclusive). The end position is relative to the order of the query. The
     * document must contain all of the fields provided in the orderBy of this
     * query.
     *
     * @param snapshot The snapshot of the document to end before.
     * @return The created Query.
     */
    endBefore(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends before the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to end this query before, in order
     * of the query's order by.
     * @return The created Query.
     */
    endBefore(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends at the provided document
     * (inclusive). The end position is relative to the order of the query. The
     * document must contain all of the fields provided in the orderBy of this
     * query.
     *
     * @param snapshot The snapshot of the document to end at.
     * @return The created Query.
     */
    endAt(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends at the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to end this query at, in order
     * of the query's order by.
     * @return The created Query.
     */
    endAt(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Executes the query and returns the results as a `QuerySnapshot`.
     *
     * Note: By default, get() attempts to provide up-to-date data when possible
     * by waiting for data from the server, but it may return cached data or fail
     * if you are offline and the server cannot be reached. This behavior can be
     * altered via the `GetOptions` parameter.
     *
     * @param options An object to configure the get behavior.
     * @return A Promise that will be resolved with the results of the Query.
     */
    get(options?: firebase.firestore.GetOptions): Promise<AugmentedQuerySnapshot<T>>;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param observer A single object containing `next` and `error` callbacks.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(observer: {
        next?: (snapshot: AugmentedQuerySnapshot<T>) => void;
        error?: (error: firebase.firestore.FirestoreError) => void;
        complete?: () => void;
    }): () => void;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param options Options controlling the listen behavior.
     * @param observer A single object containing `next` and `error` callbacks.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        observer: {
            next?: (snapshot: AugmentedQuerySnapshot<T>) => void;
            error?: (error: firebase.firestore.FirestoreError) => void;
            complete?: () => void;
        },
    ): () => void;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param onNext A callback to be called every time a new `QuerySnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        onNext: (snapshot: AugmentedQuerySnapshot<T>) => void,
        onError?: (error: firebase.firestore.FirestoreError) => void,
        onCompletion?: () => void,
    ): () => void;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param options Options controlling the listen behavior.
     * @param onNext A callback to be called every time a new `QuerySnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        onNext: (snapshot: AugmentedQuerySnapshot<T>) => void,
        onError?: (error: firebase.firestore.FirestoreError) => void,
        onCompletion?: () => void,
    ): () => void;

    /**
     * A reference to the containing `DocumentReference` if this is a subcollection.
     * If this isn't a subcollection, the reference is null.
     */
    readonly parent: AugmentedDocumentReference<firebase.firestore.DocumentData> | null;

    /**
     * Get a `DocumentReference` for the document within the collection at the
     * specified path. If no path is specified, an automatically-generated
     * unique ID will be used for the returned DocumentReference.
     *
     * @param documentPath A slash-separated path to a document.
     * @return The `DocumentReference` instance.
     */
    doc(documentPath?: string): AugmentedDocumentReference<T>;

    /**
     * Add a new document to this collection with the specified data, assigning
     * it a document ID automatically.
     *
     * @param data An Object containing the data for the new document.
     * @return A Promise resolved with a `DocumentReference` pointing to the
     * newly created document after it has been written to the backend.
     */
    add(data: T): Promise<AugmentedDocumentReference<T>>;

    /**
     * Applies a custom data converter to this CollectionReference, allowing you
     * to use your own custom model objects with Firestore. When you call add()
     * on the returned CollectionReference instance, the provided converter will
     * convert between Firestore data and your custom type U.
     *
     * Passing in `null` as the converter parameter removes the current
     * converter.
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A CollectionReference<U> that uses the provided converter.
     */
    withConverter(converter: null): AugmentedCollectionReference<firebase.firestore.DocumentData>;
    /**
     * Applies a custom data converter to this CollectionReference, allowing you
     * to use your own custom model objects with Firestore. When you call add()
     * on the returned CollectionReference instance, the provided converter will
     * convert between Firestore data and your custom type U.
     *
     * @param converter Converts objects to and from Firestore.
     * @return A CollectionReference<U> that uses the provided converter.
     */
    withConverter<U>(converter: firebase.firestore.FirestoreDataConverter<U>): AugmentedCollectionReference<U>;
}

export interface AugmentedQuery<T = firebase.firestore.DocumentData>
    extends firebase.firestore.Query<T>,
        ExtraQueryProps<T> {
    /**
     * The `Firestore` for the Firestore database (useful for performing
     * transactions, etc.).
     */
    readonly firestore: AugmentedFirestore;

    /**
     * Creates and returns a new Query with the additional filter that documents
     * must contain the specified field and the value should satisfy the
     * relation constraint provided.
     *
     * @param fieldPath The path to compare
     * @param opStr The operation string (e.g "<", "<=", "==", ">", ">=").
     * @param value The value for comparison
     * @return The created Query.
     */
    where(
        fieldPath: string | firebase.firestore.FieldPath,
        opStr: firebase.firestore.WhereFilterOp,
        value: any,
    ): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that's additionally sorted by the
     * specified field, optionally in descending order instead of ascending.
     *
     * @param fieldPath The field to sort by.
     * @param directionStr Optional direction to sort by (`asc` or `desc`). If
     * not specified, order will be ascending.
     * @return The created Query.
     */
    orderBy(
        fieldPath: string | firebase.firestore.FieldPath,
        directionStr?: firebase.firestore.OrderByDirection,
    ): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that only returns the first matching
     * documents.
     *
     * @param limit The maximum number of items to return.
     * @return The created Query.
     */
    limit(limit: number): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that only returns the last matching
     * documents.
     *
     * You must specify at least one `orderBy` clause for `limitToLast` queries,
     * otherwise an exception will be thrown during execution.
     *
     * @param limit The maximum number of items to return.
     * @return The created Query.
     */
    limitToLast(limit: number): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts at the provided document
     * (inclusive). The starting position is relative to the order of the query.
     * The document must contain all of the fields provided in the `orderBy` of
     * this query.
     *
     * @param snapshot The snapshot of the document to start at.
     * @return The created Query.
     */
    startAt(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts at the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to start this query at, in order
     * of the query's order by.
     * @return The created Query.
     */
    startAt(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts after the provided document
     * (exclusive). The starting position is relative to the order of the query.
     * The document must contain all of the fields provided in the orderBy of
     * this query.
     *
     * @param snapshot The snapshot of the document to start after.
     * @return The created Query.
     */
    startAfter(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that starts after the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to start this query after, in order
     * of the query's order by.
     * @return The created Query.
     */
    startAfter(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends before the provided document
     * (exclusive). The end position is relative to the order of the query. The
     * document must contain all of the fields provided in the orderBy of this
     * query.
     *
     * @param snapshot The snapshot of the document to end before.
     * @return The created Query.
     */
    endBefore(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends before the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to end this query before, in order
     * of the query's order by.
     * @return The created Query.
     */
    endBefore(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends at the provided document
     * (inclusive). The end position is relative to the order of the query. The
     * document must contain all of the fields provided in the orderBy of this
     * query.
     *
     * @param snapshot The snapshot of the document to end at.
     * @return The created Query.
     */
    endAt(snapshot: AugmentedDocumentSnapshot<any>): AugmentedQuery<T>;

    /**
     * Creates and returns a new Query that ends at the provided fields
     * relative to the order of the query. The order of the field values
     * must match the order of the order by clauses of the query.
     *
     * @param fieldValues The field values to end this query at, in order
     * of the query's order by.
     * @return The created Query.
     */
    endAt(...fieldValues: any[]): AugmentedQuery<T>;

    /**
     * Executes the query and returns the results as a `QuerySnapshot`.
     *
     * Note: By default, get() attempts to provide up-to-date data when possible
     * by waiting for data from the server, but it may return cached data or fail
     * if you are offline and the server cannot be reached. This behavior can be
     * altered via the `GetOptions` parameter.
     *
     * @param options An object to configure the get behavior.
     * @return A Promise that will be resolved with the results of the Query.
     */
    get(options?: firebase.firestore.GetOptions): Promise<AugmentedQuerySnapshot<T>>;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param observer A single object containing `next` and `error` callbacks.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(observer: {
        next?: (snapshot: AugmentedQuerySnapshot<T>) => void;
        error?: (error: firebase.firestore.FirestoreError) => void;
        complete?: () => void;
    }): () => void;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param options Options controlling the listen behavior.
     * @param observer A single object containing `next` and `error` callbacks.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        observer: {
            next?: (snapshot: AugmentedQuerySnapshot<T>) => void;
            error?: (error: firebase.firestore.FirestoreError) => void;
            complete?: () => void;
        },
    ): () => void;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param onNext A callback to be called every time a new `QuerySnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        onNext: (snapshot: AugmentedQuerySnapshot<T>) => void,
        onError?: (error: firebase.firestore.FirestoreError) => void,
        onCompletion?: () => void,
    ): () => void;

    /**
     * Attaches a listener for QuerySnapshot events. You may either pass
     * individual `onNext` and `onError` callbacks or pass a single observer
     * object with `next` and `error` callbacks. The listener can be cancelled by
     * calling the function that is returned when `onSnapshot` is called.
     *
     * NOTE: Although an `onCompletion` callback can be provided, it will
     * never be called because the snapshot stream is never-ending.
     *
     * @param options Options controlling the listen behavior.
     * @param onNext A callback to be called every time a new `QuerySnapshot`
     * is available.
     * @param onError A callback to be called if the listen fails or is
     * cancelled. No further callbacks will occur.
     * @return An unsubscribe function that can be called to cancel
     * the snapshot listener.
     */
    onSnapshot(
        options: firebase.firestore.SnapshotListenOptions,
        onNext: (snapshot: AugmentedQuerySnapshot<T>) => void,
        onError?: (error: firebase.firestore.FirestoreError) => void,
        onCompletion?: () => void,
    ): () => void;

    /**
     * Applies a custom data converter to this Query, allowing you to use your
     * own custom model objects with Firestore. When you call get() on the
     * returned Query, the provided converter will convert between Firestore
     * data and your custom type U.
     *
     * Passing in `null` as the converter parameter removes the current
     * converter.
     *
     * @param converter Converts objects to and from Firestore. Passing in
     * `null` removes the current converter.
     * @return A Query<U> that uses the provided converter.
     */
    withConverter(converter: null): AugmentedQuery<firebase.firestore.DocumentData>;
    /**
     * Applies a custom data converter to this Query, allowing you to use your
     * own custom model objects with Firestore. When you call get() on the
     * returned Query, the provided converter will convert between Firestore
     * data and your custom type U.
     *
     * @param converter Converts objects to and from Firestore.
     * @return A Query<U> that uses the provided converter.
     */
    withConverter<U>(converter: firebase.firestore.FirestoreDataConverter<U>): AugmentedQuery<U>;
}

export interface AugmentedDocumentSnapshot<T = firebase.firestore.DocumentData>
    extends firebase.firestore.DocumentSnapshot<T> {
    /**
     * The `DocumentReference` for the document included in the `DocumentSnapshot`.
     */
    readonly ref: AugmentedDocumentReference<T>;
}

export interface AugmentedQueryDocumentSnapshot<T = firebase.firestore.DocumentData>
    extends firebase.firestore.QueryDocumentSnapshot<T> {
    /**
     * The `DocumentReference` for the document included in the `DocumentSnapshot`.
     */
    readonly ref: AugmentedDocumentReference<T>;
}

export interface AugmentedQuerySnapshot<T = firebase.firestore.DocumentData>
    extends firebase.firestore.QuerySnapshot<T> {
    /**
     * The query on which you called `get` or `onSnapshot` in order to get this
     * `QuerySnapshot`.
     */
    readonly query: AugmentedQuery<T>;

    /** An array of all the documents in the `QuerySnapshot`. */
    readonly docs: Array<AugmentedQueryDocumentSnapshot<T>>;

    /**
     * Enumerates all of the documents in the `QuerySnapshot`.
     *
     * @param callback A callback to be called with a `QueryDocumentSnapshot` for
     * each document in the snapshot.
     * @param thisArg The `this` binding for the callback.
     */
    forEach(callback: (result: AugmentedQueryDocumentSnapshot<T>) => void, thisArg?: any): void;
}

export interface AugmentedTransaction extends firebase.firestore.Transaction {
    /**
     * Reads the document referenced by the provided `DocumentReference.`
     *
     * @param documentRef A reference to the document to be read.
     * @return A DocumentSnapshot for the read data.
     */
    get<T>(documentRef: firebase.firestore.DocumentReference<T>): Promise<AugmentedDocumentSnapshot<T>>;
}

// END WORKAROUND

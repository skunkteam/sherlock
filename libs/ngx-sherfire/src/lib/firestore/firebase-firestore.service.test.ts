import { TestBed } from '@angular/core/testing';
import firebase from 'firebase/app';
import { NgxSherfireModule } from '../ngx-sherfire.module';
import { FirebaseFirestore } from './firebase-firestore.service';

describe(FirebaseFirestore, () => {
    let firestore: FirebaseFirestore;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [NgxSherfireModule.forRoot({ projectId: 'FAKE_PROJECT_ID', ...({} as any) })],
        });
        firestore = TestBed.inject(FirebaseFirestore);
        await firestore.disableNetwork();
    });

    afterEach(() => {
        firebase.apps.forEach(app => app.delete());
    });

    test('access to data', async () => {
        const latestDocData$ = firestore.collection('collection').doc('doc1').data$;
        const latestCollectionData$ = firestore.collection('collection').data$;
        const latestCollectionDocs$ = firestore.collection('collection').docs$;

        // Activate derivables
        latestDocData$.react(() => 0);
        latestCollectionData$.react(() => 0);
        latestCollectionDocs$.react(() => 0);

        void firestore.doc('collection/doc1').set({ some: 'data' });

        await expect(latestDocData$.toPromise({ when: d => d.value?.some })).resolves.toEqual({ some: 'data' });
        await expect(latestCollectionData$.toPromise({ when: d => !!d.get().length })).resolves.toEqual([
            { some: 'data' },
        ]);

        const some$ = latestDocData$.pluck('some');
        some$.set('other data');
        await expect(latestDocData$.toPromise({ when: d => d.value?.some.includes('other') })).resolves.toEqual({
            some: 'other data',
        });
        await expect(
            latestCollectionData$.toPromise({ when: d => d.get()[0].some.includes('other') }),
        ).resolves.toEqual([{ some: 'other data' }]);

        void firestore.collection('collection').add({ data: 'here' });

        await expect(
            latestCollectionData$.toPromise({ when: d => d.get().length === 2 }),
        ).resolves.toIncludeSameMembers([{ some: 'other data' }, { data: 'here' }]);

        await expect(
            latestCollectionDocs$.toPromise({ when: d => d.get().length === 2 }),
        ).resolves.toIncludeSameMembers([
            expect.any(FirebaseFirestore.QueryDocumentSnapshot),
            expect.any(FirebaseFirestore.QueryDocumentSnapshot),
        ]);
    });

    test('caching of derivables', () => {
        const docA = firestore.doc('collection/document');
        const docB = firestore.collection('collection').doc('document');
        // Trigger the cache
        docA.snapshot$.value;
        docA.data$.value;

        expect(docA).not.toBe(docB);
        expect(docA.snapshot$).toBe(docB.snapshot$);
        expect(docA.data$).toBe(docB.data$);

        const colA = firestore.collection('collection/document/subcollection');
        const colB = firestore.collection('collection').doc('document').collection('subcollection');
        // Trigger the cache
        colA.snapshot$.value;
        colA.docs$.value;
        colA.data$.value;

        expect(colA).not.toBe(colB);
        expect(colA.snapshot$).toBe(colB.snapshot$);
        expect(colA.docs$).toBe(colB.docs$);
        expect(colA.data$).toBe(colB.data$);

        // Does not work for queries.

        const qA = colA.limit(10);
        const qB = colB.limit(10);
        // Trigger the cache;
        qA.snapshot$.value;
        qA.docs$.value;
        qA.data$.value;

        expect(colA).not.toBe(colB);
        expect(qA.snapshot$).not.toBe(qB.snapshot$);
        expect(qA.docs$).not.toBe(qB.docs$);
        expect(qA.data$).not.toBe(qB.data$);
    });
});

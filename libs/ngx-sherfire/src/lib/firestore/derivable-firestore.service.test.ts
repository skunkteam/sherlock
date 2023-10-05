import { TestBed } from '@angular/core/testing';
import { deleteApp, getApps } from 'firebase/app';
import {
    QueryDocumentSnapshot,
    addDoc,
    collection,
    disableNetwork,
    doc,
    limit,
    query,
    setDoc,
} from 'firebase/firestore';
import { NgxSherfireModule } from '../ngx-sherfire.module';
import { DerivableFirestore } from './derivable-firestore.service';
import { SherfireFirestore } from './sherfire-firestore.service';

describe(DerivableFirestore, () => {
    let firestore: SherfireFirestore;
    let service: DerivableFirestore;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [NgxSherfireModule.forRoot({ projectId: 'FAKE_PROJECT_ID', ...({} as any) })],
        });
        firestore = TestBed.inject(SherfireFirestore);
        service = TestBed.inject(DerivableFirestore);
        await disableNetwork(firestore);
    });

    afterEach(() => {
        for (const app of getApps()) {
            void deleteApp(app); // promise never resolves in offline modus
        }
    });

    test('access to data', async () => {
        const latestDocData$ = service.data$(doc(firestore, 'collection', 'doc1'));
        const latestCollectionData$ = service.data$(collection(firestore, 'collection'));
        const latestCollectionDocs$ = service.docs$(collection(firestore, 'collection'));

        // Activate derivables
        latestDocData$.react(() => 0);
        latestCollectionData$.react(() => 0);
        latestCollectionDocs$.react(() => 0);

        void setDoc(doc(firestore, 'collection', 'doc1'), { some: 'data' });

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

        void addDoc(collection(firestore, 'collection'), { data: 'here' });

        await expect(
            latestCollectionData$.toPromise({ when: d => d.get().length === 2 }),
        ).resolves.toIncludeSameMembers([{ some: 'other data' }, { data: 'here' }]);

        await expect(
            latestCollectionDocs$.toPromise({ when: d => d.get().length === 2 }),
        ).resolves.toIncludeSameMembers([expect.any(QueryDocumentSnapshot), expect.any(QueryDocumentSnapshot)]);
    });

    test('caching of derivables', () => {
        const docA = doc(firestore, 'collection/document');
        const docB = doc(collection(firestore, 'collection'), 'document');
        // Trigger the cache
        service.snapshot$(docA).value;
        service.data$(docA).value;

        expect(docA).not.toBe(docB);
        expect(service.snapshot$(docA)).toBe(service.snapshot$(docB));
        expect(service.data$(docA)).toBe(service.data$(docB));

        const colA = collection(firestore, 'collection/document/subcollection');
        const colB = collection(doc(collection(firestore, 'collection'), 'document'), 'subcollection');
        // Trigger the cache
        service.snapshot$(colA).value;
        service.docs$(colA).value;
        service.data$(colA).value;

        expect(colA).not.toBe(colB);
        expect(service.snapshot$(colA)).toBe(service.snapshot$(colB));
        expect(service.docs$(colA)).toBe(service.docs$(colB));
        expect(service.data$(colA)).toBe(service.data$(colB));

        // Does not work for queries.

        const qA = query(colA, limit(10));
        const qB = query(colB, limit(10));
        // Trigger the cache;
        service.snapshot$(qA).value;
        service.docs$(qA).value;
        service.data$(qA).value;

        expect(colA).not.toBe(colB);
        expect(service.snapshot$(qA)).not.toBe(service.snapshot$(qB));
        expect(service.docs$(qA)).not.toBe(service.docs$(qB));
        expect(service.data$(qA)).not.toBe(service.data$(qB));
    });
});

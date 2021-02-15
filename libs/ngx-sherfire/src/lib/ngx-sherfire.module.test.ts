import { TestBed } from '@angular/core/testing';
import { isDerivable, Unwrap } from '@skunkteam/sherlock';
import firebase from 'firebase';
import { FirebaseApp } from './app';
import { FirebaseAuth, FirebaseUser$ } from './auth';
import type { FirebaseConfig } from './firebase-config.service';
import { FirebaseFirestore } from './firestore';
import { NgxSherfireModule } from './ngx-sherfire.module';

describe(NgxSherfireModule, () => {
    const config: FirebaseConfig = {
        apiKey: 'apiKey',
        appId: 'appId',
        authDomain: 'authDomain',
        databaseURL: 'databaseURL',
        messagingSenderId: 'messagingSenderId',
        projectId: 'projectId',
        storageBucket: 'storageBucket',
        firestoreEmulator: { host: 'host', port: 1234 },
        firestoreSettings: { ignoreUndefinedProperties: true },
    };

    const createAuth = jest.fn<Partial<firebase.auth.Auth>, []>();
    const createFirestore = jest.fn<Partial<firebase.firestore.Firestore>, []>();
    const fakeApp = ({
        auth: createAuth,
        firestore: createFirestore,
    } as Partial<firebase.app.App>) as firebase.app.App;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [NgxSherfireModule.forRoot(config)] });
        jest.spyOn(firebase, 'initializeApp').mockReturnValue(fakeApp);
    });

    describe(FirebaseApp, () => {
        test('instantiation', () => {
            expect(firebase.initializeApp).not.toBeCalled();
            expect(TestBed.inject(FirebaseApp)).toBe(fakeApp);
            expect(firebase.initializeApp).toBeCalledTimes(1);
            expect(firebase.initializeApp).toBeCalledWith(config);
        });
    });

    describe(FirebaseAuth, () => {
        test('instantiation', () => {
            const theAuth = {};
            createAuth.mockReturnValue(theAuth);
            expect(TestBed.inject(FirebaseAuth)).toBe(theAuth);
        });

        describe('#user$', () => {
            let firebaseAuth: FirebaseAuth;
            let firebaseUser$: FirebaseUser$;
            let sampleUser: jest.Mocked<firebase.User>;
            let unsubscribe: jest.MockedFunction<firebase.Unsubscribe>;
            let onIdTokenChanged: jest.MockedFunction<firebase.auth.Auth['onIdTokenChanged']>;
            beforeEach(() => {
                onIdTokenChanged = jest.fn().mockReturnValue((unsubscribe = jest.fn()));
                createAuth.mockReturnValue({ onIdTokenChanged, currentUser: null });
                firebaseAuth = TestBed.inject(FirebaseAuth);
                firebaseUser$ = TestBed.inject(FirebaseUser$);
                sampleUser = ({ getIdTokenResult: jest.fn() } as Partial<typeof sampleUser>) as typeof sampleUser;
            });

            test('with no currentUser', async () => {
                expect(isDerivable(firebaseUser$)).toBeTrue();

                expect(onIdTokenChanged).not.toBeCalled();
                let user: Unwrap<typeof firebaseUser$> | undefined;
                const stop = firebaseUser$.react(u => (user = u));
                expect(onIdTokenChanged).toBeCalledTimes(1);

                const [[cb]] = onIdTokenChanged.mock.calls;
                if (typeof cb !== 'function') {
                    fail('expected callback to onIdTokenChanged to be a function');
                }

                // reactor has not fired because we don't know yet whether we are logged in or not.
                expect(user).toBeUndefined();
                expect(firebaseUser$.resolved).toBeFalse();

                // Firebase responds saying that the user is not logged in.
                cb(null);

                expect(user).toBeNull();
                expect(firebaseUser$.resolved).toBeTrue();

                // Apparently, the user now logged in...
                sampleUser.getIdTokenResult.mockResolvedValue({ token: 'the token' } as any);
                cb(sampleUser);

                // UI should not respond yet, we are still in the process of receiving more info
                expect(user).toBeNull();
                expect(firebaseUser$.resolved).toBeFalse();

                expect(sampleUser.getIdTokenResult).toBeCalledTimes(1);

                await new Promise(resolve => setTimeout(resolve, 0));

                expect(user).toEqual({ user: sampleUser, idtoken: { token: 'the token' } });

                expect(unsubscribe).not.toBeCalled();
                expect(firebaseUser$.resolved).toBeTrue();
                stop();
                expect(unsubscribe).toBeCalledTimes(1);
                expect(firebaseUser$.resolved).toBeFalse();
                expect(onIdTokenChanged).toBeCalledTimes(1);
            });

            test('with currentUser', async () => {
                sampleUser.getIdTokenResult.mockResolvedValue({ token: 'other token' } as any);
                firebaseAuth.currentUser = sampleUser;

                let user: Unwrap<typeof firebaseUser$> | undefined;
                firebaseUser$.react(u => (user = u));
                expect(onIdTokenChanged).toBeCalledTimes(1);

                // reactor has not fired because we don't know yet whether we are logged in or not...
                expect(user).toBeUndefined();
                expect(firebaseUser$.resolved).toBeFalse();

                // but we have a synchronous currentUser that is being checked.
                expect(sampleUser.getIdTokenResult).toBeCalledTimes(1);

                await new Promise(resolve => setTimeout(resolve, 0));

                expect(user).toEqual({ user: sampleUser, idtoken: { token: 'other token' } });
            });

            test('on error', () => {
                firebaseUser$.autoCache().value;
                const [[, reportErr]] = onIdTokenChanged.mock.calls;
                const theError = { code: 'firebase code', message: 'firebase auth message' };
                reportErr?.(theError);
                expect(firebaseUser$.error).toBe(theError);
            });

            test('on complete', () => {
                firebaseUser$.autoCache().value;
                const [[, , reportDone]] = onIdTokenChanged.mock.calls;
                reportDone?.();
                expect(firebaseUser$.final).toBeTrue();
            });
        });
    });

    describe(FirebaseFirestore, () => {
        test('instantiation', () => {
            const theFirestore = { settings: jest.fn(), useEmulator: jest.fn() };
            createFirestore.mockReturnValue(theFirestore);
            expect(TestBed.inject(FirebaseFirestore)).toBe(theFirestore);
            expect(theFirestore.settings).toHaveBeenCalledWith(config.firestoreSettings);
            expect(theFirestore.useEmulator).toHaveBeenCalledWith(
                config.firestoreEmulator?.host,
                config.firestoreEmulator?.port,
            );

            expect('snapshot$' in firebase.firestore.DocumentReference.prototype).toBeTrue();
            expect('data$' in firebase.firestore.DocumentReference.prototype).toBeTrue();
            expect('snapshot$' in firebase.firestore.Query.prototype).toBeTrue();
            expect('docs$' in firebase.firestore.Query.prototype).toBeTrue();
            expect('data$' in firebase.firestore.Query.prototype).toBeTrue();
            expect('snapshot$' in firebase.firestore.CollectionReference.prototype).toBeTrue();
            expect('docs$' in firebase.firestore.CollectionReference.prototype).toBeTrue();
            expect('data$' in firebase.firestore.CollectionReference.prototype).toBeTrue();
        });
    });
});

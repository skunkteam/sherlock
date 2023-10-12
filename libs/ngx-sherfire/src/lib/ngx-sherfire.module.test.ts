import { TestBed } from '@angular/core/testing';
import * as appModule from 'firebase/app';
import * as authModule from 'firebase/auth';
import * as firestoreModule from 'firebase/firestore';
import { SherfireApp } from './app';
import { SherfireAuth } from './auth';
import type { FirebaseConfig } from './firebase-config.service';
import { SherfireFirestore } from './firestore';
import { NgxSherfireModule } from './ngx-sherfire.module';

jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

describe(NgxSherfireModule, () => {
    const config = {
        apiKey: 'apiKey',
        appId: 'appId',
        authDomain: 'authDomain',
        databaseURL: 'databaseURL',
        messagingSenderId: 'messagingSenderId',
        projectId: 'projectId',
        storageBucket: 'storageBucket',
        firestoreEmulator: { host: 'host', port: 1234 },
        firestoreSettings: { ignoreUndefinedProperties: true },
        appSettings: { automaticDataCollectionEnabled: false },
    } as const satisfies FirebaseConfig;

    const fakeApp: appModule.FirebaseApp = {
        name: '[FAKE]',
        options: {},
        automaticDataCollectionEnabled: false,
    };
    const fakeAuth = {
        app: fakeApp,
    } as Partial<authModule.Auth> as authModule.Auth;
    } satisfies Partial<authModule.Auth> as authModule.Auth;
        app: fakeApp,
        type: 'firestore',
        toJSON() {
            return this;
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [NgxSherfireModule.forRoot(config)] });
        jest.spyOn(appModule, 'initializeApp').mockReturnValue(fakeApp);
        jest.spyOn(authModule, 'getAuth').mockReturnValue(fakeAuth);
        jest.spyOn(firestoreModule, 'initializeFirestore').mockReturnValue(fakeFirestore);
    });

    describe(SherfireApp, () => {
        test('instantiation', () => {
            expect(appModule.initializeApp).not.toBeCalled();
            expect(TestBed.inject(SherfireApp)).toBe(fakeApp);
            expect(appModule.initializeApp).toHaveBeenCalledExactlyOnceWith(config, config.appSettings);
        });
    });

    describe(SherfireAuth, () => {
        test('instantiation', () => {
            expect(authModule.getAuth).not.toBeCalled();
            expect(TestBed.inject(SherfireAuth)).toBe(fakeAuth);
            expect(authModule.getAuth).toHaveBeenCalledExactlyOnceWith(fakeApp);
        });
    });

    describe(SherfireFirestore, () => {
        test('instantiation', () => {
            jest.spyOn(firestoreModule, 'connectFirestoreEmulator');
            expect(firestoreModule.initializeFirestore).not.toBeCalled();
            expect(firestoreModule.connectFirestoreEmulator).not.toBeCalled();
            expect(TestBed.inject(SherfireFirestore)).toBe(fakeFirestore);
            expect(firestoreModule.initializeFirestore).toHaveBeenCalledExactlyOnceWith(
                fakeApp,
                config.firestoreSettings,
            );
            expect(firestoreModule.connectFirestoreEmulator).toHaveBeenCalledExactlyOnceWith(
                fakeFirestore,
                config.firestoreEmulator.host,
                config.firestoreEmulator.port,
            );
        });
    });
});

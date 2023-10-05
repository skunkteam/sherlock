import { TestBed } from '@angular/core/testing';
import { isDerivable, type Unwrap } from '@skunkteam/sherlock';
import { FirebaseError } from 'firebase/app';
import type { Auth, Unsubscribe, User } from 'firebase/auth';
import { NgxSherfireModule } from '../ngx-sherfire.module';
import { FirebaseUser$ } from './firebase-user$.service';
import { SherfireAuth } from './sherfire-auth.service';

describe(FirebaseUser$, () => {
    let firebaseAuth: Mutable<Auth>;
    let firebaseUser$: FirebaseUser$;
    let sampleUser: jest.Mocked<User>;
    let unsubscribe: jest.MockedFunction<Unsubscribe>;
    let onIdTokenChanged: jest.MockedFunction<Auth['onIdTokenChanged']>;

    beforeEach(() => {
        sampleUser = { getIdTokenResult: jest.fn() } as Partial<typeof sampleUser> as typeof sampleUser;
        TestBed.configureTestingModule({
            imports: [NgxSherfireModule.forRoot({ projectId: 'FAKE_PROJECT_ID', ...({} as any) })],
        });
        TestBed.overrideProvider(SherfireAuth, {
            useValue: {
                onIdTokenChanged: (onIdTokenChanged = jest.fn().mockReturnValue((unsubscribe = jest.fn()))),
            } satisfies Partial<Auth>,
        });
        firebaseAuth = TestBed.inject(SherfireAuth);
        firebaseUser$ = TestBed.inject(FirebaseUser$);
    });

    test('with no currentUser', async () => {
        expect(isDerivable(firebaseUser$)).toBeTrue();

        expect(onIdTokenChanged).not.toBeCalled();
        let userInfo: Unwrap<typeof firebaseUser$> | undefined;
        const stop = firebaseUser$.react(u => (userInfo = u));
        expect(onIdTokenChanged).toBeCalledTimes(1);

        const [[cb]] = onIdTokenChanged.mock.calls;
        if (typeof cb !== 'function') {
            fail('expected callback to onIdTokenChanged to be a function');
        }

        // reactor has not fired because we don't know yet whether we are logged in or not.
        expect(userInfo).toBeUndefined();
        expect(firebaseUser$.resolved).toBeFalse();

        // Firebase responds saying that the user is not logged in.
        cb(null);

        expect(userInfo).toBeNull();
        expect(firebaseUser$.resolved).toBeTrue();

        // Apparently, the user now logged in...
        sampleUser.getIdTokenResult.mockResolvedValue({ token: 'the token' } as any);
        cb(sampleUser as User);

        // UI should not respond yet, we are still in the process of receiving more info
        expect(userInfo).toBeNull();
        expect(firebaseUser$.resolved).toBeFalse();

        expect(sampleUser.getIdTokenResult).toBeCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(userInfo).toEqual({ user: sampleUser, idtoken: { token: 'the token' } });

        expect(unsubscribe).not.toBeCalled();
        expect(firebaseUser$.resolved).toBeTrue();
        stop();
        expect(unsubscribe).toBeCalledTimes(1);
        expect(firebaseUser$.resolved).toBeFalse();
        expect(onIdTokenChanged).toBeCalledTimes(1);
    });

    test('with currentUser', async () => {
        expect(firebaseUser$).not.toBeUndefined();
        sampleUser.getIdTokenResult.mockResolvedValue({ token: 'other token' } as any);
        firebaseAuth.currentUser = sampleUser as User;

        let userInfo: Unwrap<typeof firebaseUser$> | undefined;
        firebaseUser$.react(u => (userInfo = u));
        expect(onIdTokenChanged).toBeCalledTimes(1);

        // reactor has not fired because we don't know yet whether we are logged in or not...
        expect(userInfo).toBeUndefined();
        expect(firebaseUser$.resolved).toBeFalse();

        // but we have a synchronous currentUser that is being checked.
        expect(sampleUser.getIdTokenResult).toBeCalledTimes(1);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(userInfo).toEqual({ user: sampleUser, idtoken: { token: 'other token' } });
    });

    test('on idtoken change', async () => {
        sampleUser.getIdTokenResult?.mockResolvedValueOnce({ token: 'the first token' } as any);
        firebaseAuth.currentUser = sampleUser as User;

        let userInfo: Unwrap<typeof firebaseUser$> | undefined;
        firebaseUser$.react(u => (userInfo = u));
        expect(onIdTokenChanged).toBeCalledTimes(1);
        const [[cb]] = onIdTokenChanged.mock.calls;
        if (typeof cb !== 'function') {
            fail('expected callback to onIdTokenChanged to be a function');
        }

        // Resolve the getIdTokenResult promise
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(userInfo).toEqual({ user: sampleUser, idtoken: { token: 'the first token' } });
        expect(firebaseUser$.resolved).toBeTrue();

        sampleUser.getIdTokenResult.mockResolvedValueOnce({ token: 'the second token' } as any);
        cb(sampleUser);

        // UI should not respond yet, we are still in the process of receiving more info
        expect(userInfo).toEqual({ user: sampleUser, idtoken: { token: 'the first token' } });
        expect(firebaseUser$.resolved).toBeFalse();

        expect(sampleUser.getIdTokenResult).toBeCalledTimes(2);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(userInfo).toEqual({ user: sampleUser, idtoken: { token: 'the second token' } });
    });

    test('on error', () => {
        firebaseUser$.autoCache().value;
        const [[, reportErr]] = onIdTokenChanged.mock.calls;
        const theError = new FirebaseError('firebase code', 'firebase auth message');
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

type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};

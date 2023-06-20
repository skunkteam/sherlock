import { atom } from '@skunkteam/sherlock';
import { fromObservable } from './from-observable';

describe('sherlock-utils/fromObservable', () => {
    // PREVENT RXJS FROM SHOWING UP IN PACKAGE.JSON:
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Subject, defer, of } = require('rx' + 'js') as typeof import('rxjs');

    it('should be unresolved until connected and the first value has been emitted', () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj);

        expect(d$.resolved).toBeFalse();
        let value: string | undefined;
        d$.react(v => (value = v), { skipFirst: true, once: true });

        expect(d$.resolved).toBeFalse();

        subj.next('first value');

        expect(d$.resolved).toBeTrue();
        expect(value).toBeUndefined();

        subj.next('this stops the reactor');

        expect(d$.resolved).toBeFalse();
        expect(d$.value).toBeUndefined();
        expect(value).toBe('this stops the reactor');

        subj.next('this is ignored');

        expect(d$.resolved).toBeFalse();
        expect(d$.value).toBeUndefined();
        expect(value).toBe('this stops the reactor');
    });

    it('should subscribe to observable when used to power a reactor', () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj);

        expect(subj.observers).toHaveLength(0);

        let value: string | undefined;
        let reactions = 0;
        let done = d$.react(v => (++reactions, (value = v)));

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(0);

        subj.next('value');

        expect(reactions).toBe(1);
        expect(value).toBe('value');
        expect(d$.value).toBe('value');

        done();

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(1);
        expect(d$.value).toBeUndefined();

        subj.next('another value');

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(1);
        expect(d$.value).toBeUndefined();

        done = d$.react(v => (++reactions, (value = v)));

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(1);
        expect(d$.value).toBeUndefined();

        subj.next('yet another value');

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(2);
        expect(d$.value).toBe('yet another value');

        done();

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(2);
        expect(d$.value).toBeUndefined();
    });

    it('should allow opting into old behavior of caching values while not subscribed', () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj).take({ when: d => d.resolved });

        expect(subj.observers).toHaveLength(0);

        let value: string | undefined;
        let reactions = 0;
        let done = d$.react(v => (++reactions, (value = v)));

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(0);

        subj.next('value');

        expect(reactions).toBe(1);
        expect(value).toBe('value');
        expect(d$.get()).toBe('value');

        done();

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(1);
        expect(d$.get()).toBe('value');

        subj.next('another value');

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(1);
        expect(d$.get()).toBe('value');

        done = d$.react(v => (++reactions, (value = v)));

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(2);
        expect(d$.get()).toBe('value');

        subj.next('yet another value');

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(3);
        expect(d$.get()).toBe('yet another value');

        done();

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(3);
        expect(d$.get()).toBe('yet another value');
    });

    it('should disconnect and finalize when the observable completes', () => {
        const subj = new Subject<string>();
        let connections = 0;
        const d$ = fromObservable(defer(() => (++connections, subj)));

        expect(connections).toBe(0);

        let value = '';
        d$.react(v => (value = v));
        expect(connections).toBe(1);

        subj.next('value');
        expect(value).toBe('value');
        expect(d$.connected).toBeTrue();
        expect(d$.final).toBeFalse();

        subj.complete();
        expect(value).toBe('value');
        expect(d$.value).toBe('value');
        expect(d$.connected).toBeFalse();
        expect(d$.final).toBeTrue();

        // Should never connect again.
        d$.react(() => 0);
        expect(connections).toBe(1);
    });

    it('should disconnect and finalize when the observable errors', () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj);

        let error: unknown = '';
        d$.react(() => 0, { onError: e => (error = e) });

        expect(subj.observers.length).toBe(1);

        subj.next('value');
        expect(d$.connected).toBeTrue();
        expect(d$.final).toBeFalse();

        subj.error('oh no!');
        expect(error).toBe('oh no!');
        expect(d$.error).toBe('oh no!');
        expect(d$.connected).toBeFalse();
        expect(d$.final).toBeTrue();

        // Should never connect again.
        d$.react(() => 0, { onError: () => 0 });
        expect(subj.observers.length).toBe(0);
    });

    it('should subscribe to the observable only once with multiple reactors', () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj);

        let reactions = 0;
        const done1 = d$.react(() => ++reactions);
        const done2 = d$.react(() => ++reactions);

        expect(subj.observers).toHaveLength(1);

        subj.next('a value');

        expect(reactions).toBe(2);

        done1();
        expect(subj.observers).toHaveLength(1);
        done2();
        expect(subj.observers).toHaveLength(0);
    });

    it('should disconnect when not directly used in a derivation', () => {
        const subj = new Subject<string>();
        const obs$ = fromObservable(subj);
        const useIt$ = atom(false);
        const derivation$ = useIt$.derive(v => v && obs$.get());

        let value: string | boolean | undefined;
        let reactions = 0;
        derivation$.react(v => (++reactions, (value = v)));

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(1);
        expect(value).toBeFalse();

        useIt$.set(true);

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(1);
        expect(value).toBeFalse();

        subj.next('value');

        expect(reactions).toBe(2);
        expect(value).toBe('value');

        useIt$.set(false);

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(3);
        expect(value).toBeFalse();
    });

    it('should work with a fallback when given and not connected', () => {
        const subj = new Subject<string>();
        const f$ = atom('fallback');
        const d$ = fromObservable(subj).fallbackTo(f$);
        expect(d$.get()).toBe('fallback');
        expect(subj.observers).toHaveLength(0);

        let value: string | undefined;
        let reactions = 0;
        const done = d$.react(v => (++reactions, (value = v)));

        expect(subj.observers).toHaveLength(1);
        expect(reactions).toBe(1);
        expect(value).toBe('fallback');

        subj.next('value');

        expect(reactions).toBe(2);
        expect(value).toBe('value');
        expect(d$.get()).toBe('value');

        done();

        expect(subj.observers).toHaveLength(0);
        expect(reactions).toBe(2);
        expect(d$.get()).toBe('fallback');
    });

    it('should propagate errors', () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj);

        d$.autoCache();

        expect(subj.observers).toHaveLength(0);
        expect(d$.resolved).toBeFalse();
        expect(subj.observers).toHaveLength(1);

        subj.next('a value');

        expect(d$.get()).toBe('a value');

        subj.error(new Error('my error message'));

        expect(() => d$.get()).toThrowError('my error message');
    });

    it('should support toPromise', async () => {
        const subj = new Subject<string>();
        const d$ = fromObservable(subj);

        setTimeout(() => subj.next('value'), 0);

        expect(await d$.toPromise()).toBe('value');

        setTimeout(() => subj.error(new Error('my error')), 0);

        try {
            await d$.toPromise();
            throw new Error('should have thrown an error');
        } catch (e: any) {
            expect(e.message).toBe('my error');
        }
    });

    it('should support scalar observables', () => {
        const obs = of(1);
        const d$ = fromObservable(obs);
        expect(d$.value).toBe(undefined);
        expect(d$.autoCache().value).toBe(1);
    });
});

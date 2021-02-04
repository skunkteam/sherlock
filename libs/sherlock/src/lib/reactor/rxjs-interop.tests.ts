import { assertDerivableAtom, Factories } from '../derivable/base-derivable.tests';
import type { DerivableAtom } from '../interfaces';

export function testRxjsInterop(factories: Factories) {
    // PREVENT RXJS FROM SHOWING UP IN PACKAGE.JSON:
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { from } = require('rx' + 'js') as typeof import('rxjs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TestScheduler } = require('rx' + 'js/testing') as typeof import('rxjs/testing');

    describe('reactor/rxjs-interop', () => {
        let a$: DerivableAtom<string>;

        beforeEach(() => {
            a$ = assertDerivableAtom(factories.value('a'));
        });

        it('should complete the Observable immediately when the derivable is already final', () => {
            a$.setFinal('final value');
            const next = jest.fn(),
                complete = jest.fn();
            from(a$).subscribe({ next, complete });
            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith('final value');
            expect(complete).toHaveBeenCalledTimes(1);
            expect(complete).toHaveBeenCalledAfter(next);
        });

        it('should complete the Observable when the derivable becomes final', () => {
            let value = '';
            let complete = false;
            from(a$).subscribe({
                next: v => (value = v),
                complete: () => (complete = true),
            });
            expect(value).toBe('a');
            expect(complete).toBeFalse();

            a$.setFinal('b');
            expect(value).toBe('b');
            expect(complete).toBeTrue();
        });

        it('should complete the Observable when until becomes true', () => {
            let complete = false;
            let value = '';
            from(a$.take({ until: d$ => d$.get().length > 2 })).subscribe({
                next: v => (value = v),
                complete: () => (complete = true),
            });
            expect(complete).toBeFalse();
            expect(value).toBe('a');

            a$.set('aa');
            expect(complete).toBeFalse();
            expect(value).toBe('aa');

            a$.set('aaa');
            expect(complete).toBeTrue();
            expect(value).toBe('aa');
        });

        it('should complete the Observable after one value when once is true', () => {
            let complete = false;
            const values: string[] = [];
            from(a$.take({ once: true })).subscribe({
                next: v => values.push(v),
                complete: () => (complete = true),
            });
            expect(complete).toBeTrue();
            expect(values).toEqual(['a']);

            a$.set('b');
            expect(values).toEqual(['a']);
        });

        it('should skip the first value if skipFirst is true', () => {
            let complete = false;
            const values: string[] = [];
            from(a$.take({ skipFirst: true, once: true })).subscribe({
                next: v => values.push(v),
                complete: () => (complete = true),
            });
            expect(complete).toBeFalse();
            expect(Object.keys(values)).toHaveLength(0);

            a$.set('b');
            expect(complete).toBeTrue();
            expect(values).toEqual(['b']);

            a$.set('c');
            expect(complete).toBeTrue();
            expect(values).toEqual(['b']);
        });

        it('should stop the internal reactor when the Observable is unobserved', () => {
            const sub = from(a$).subscribe();
            expect(a$.observerCount).toBeGreaterThan(0);
            sub.unsubscribe();
            expect(a$.observerCount).toBe(0);
        });

        it('should support multiple subscriptions to the returned Observable', () => {
            const values1: string[] = [];
            const values2: string[] = [];
            const obs = from(a$);
            expect(a$.observerCount).toBe(0);
            const sub1 = obs.subscribe(v => values1.push(v));
            const sub2 = obs.subscribe(v => values2.push(v));
            expect(a$.observerCount).toBe(2);

            expect(values1).toEqual(['a']);
            expect(values2).toEqual(['a']);

            a$.set('b');

            expect(values1).toEqual(['a', 'b']);
            expect(values2).toEqual(['a', 'b']);

            sub1.unsubscribe();

            a$.set('c');

            expect(values1).toEqual(['a', 'b']);
            expect(values2).toEqual(['a', 'b', 'c']);

            expect(a$.connected).toBeTrue();
            sub2.unsubscribe();
            expect(a$.connected).toBeFalse();
        });

        it('should not complete on unsubscribe', () => {
            let complete = false;
            from(a$)
                .subscribe({ complete: () => (complete = true) })
                .unsubscribe();
            expect(complete).toBeFalse();
        });

        describe.each(['using observer', 'using separate callbacks'] as const)(
            '#subscribe using method: %s',
            method => {
                function subscribe(
                    next?: (value: string) => void,
                    error?: (error: any) => void,
                    complete?: () => void,
                ) {
                    switch (method) {
                        case 'using observer':
                            return a$.subscribe({ next, error, complete } as import('rxjs').PartialObserver<string>);
                        case 'using separate callbacks':
                            return a$.subscribe(next, error, complete);
                    }
                }

                type Event = { next: string } | { error: any } | { complete: true };

                function getEvents() {
                    const events: Event[] = [];
                    return {
                        events,
                        ...subscribe(
                            v => events.push({ next: v }),
                            err => events.push({ error: err }),
                            () => events.push({ complete: true }),
                        ),
                    };
                }

                it('should not emit complete on abort', () => {
                    const { events, unsubscribe } = getEvents();
                    unsubscribe();
                    expect(events).toEqual([{ next: 'a' }]);
                });

                it('should not emit complete on error', () => {
                    const { events } = getEvents();
                    a$.setError('the error');
                    expect(events).toEqual([{ next: 'a' }, { error: 'the error' }]);
                });

                it('should emit complete on a final derivable', () => {
                    const { events } = getEvents();
                    a$.makeFinal();
                    expect(events).toEqual([{ next: 'a' }, { complete: true }]);
                });

                describe('with only a next callback', () => {
                    let values: string[], unsubscribe: () => void;
                    beforeEach(() => {
                        values = [];
                        ({ unsubscribe } = subscribe(v => values.push(v)));
                        expect(values).toEqual(['a']);
                        a$.set('b');
                        expect(values).toEqual(['a', 'b']);
                    });

                    test('until Error', () => {
                        a$.setError('some error');
                        a$.set('c');
                        expect(values).toEqual(['a', 'b']);
                    });

                    test('until Final', () => {
                        a$.setFinal('c');
                        expect(values).toEqual(['a', 'b', 'c']);
                    });

                    test('until unsubscribe', () => {
                        unsubscribe();
                        a$.set('c');
                        expect(values).toEqual(['a', 'b']);
                    });
                });

                describe('with only an error callback', () => {
                    let errorCb: jest.Mock, unsubscribe: () => void;
                    beforeEach(() => {
                        ({ unsubscribe } = subscribe(undefined, (errorCb = jest.fn())));
                        a$.set('b');
                    });

                    test('until Error', () => {
                        a$.setError('some error');
                        a$.set('c');
                        a$.setError('some other error');
                        expect(errorCb).toHaveBeenCalledTimes(1);
                        expect(errorCb).toHaveBeenCalledWith('some error');
                    });

                    test('until Final', () => {
                        a$.setFinal('c');
                        expect(errorCb).not.toHaveBeenCalled();
                    });

                    test('until unsubscribe', () => {
                        unsubscribe();
                        a$.set('c');
                        expect(errorCb).not.toHaveBeenCalled();
                    });
                });

                describe('with only a complete callback', () => {
                    let completeCb: jest.Mock, unsubscribe: () => void;
                    beforeEach(() => {
                        ({ unsubscribe } = subscribe(undefined, undefined, (completeCb = jest.fn())));
                        a$.set('b');
                    });

                    test('until Error', () => {
                        a$.setError('some error');
                        a$.set('c');
                        a$.setError('some other error');
                        expect(completeCb).not.toHaveBeenCalled();
                    });

                    test('until Final', () => {
                        a$.setFinal('c');
                        expect(completeCb).toHaveBeenCalledTimes(1);
                    });

                    test('until unsubscribe', () => {
                        unsubscribe();
                        a$.set('c');
                        expect(completeCb).not.toHaveBeenCalled();
                    });
                });

                it('should support only an error callback', () => {
                    const cb = jest.fn();
                    subscribe(undefined, cb);
                    a$.set('whatever');
                    a$.setError('the first error');
                    expect(cb).toBeCalledTimes(1);
                    expect(cb).toBeCalledWith('the first error');
                    // RxJS stops subscription here
                    a$.setError('the second error');
                    expect(cb).toBeCalledTimes(1);
                });

                it('should support only a complete callback', () => {
                    const cb = jest.fn();
                    subscribe(undefined, undefined, cb);
                    a$.set('whatever');
                    expect(cb).toBeCalledTimes(0);
                    a$.setFinal('whatever');
                    expect(cb).toBeCalledTimes(1);
                });
            },
        );

        it('should be compatible with Observable.from', () => {
            new TestScheduler((actual, expected) => expect(actual).toEqual(expected)).run(
                ({ hot, expectObservable }) => {
                    const a$ = assertDerivableAtom(factories.unresolved<string>());
                    hot('--a--b--#').subscribe({ next: v => a$.set(v), error: () => a$.setError('OOPS!') });
                    expectObservable(from(a$)).toBe('--a--b--#', undefined, 'OOPS!');

                    const b$ = assertDerivableAtom(factories.value('a'));
                    hot('---b--c--|').subscribe({ next: v => b$.set(v), complete: () => b$.makeFinal() });
                    expectObservable(from(b$)).toBe('a--b--c--|');

                    // Rxjs will always disconnect on error, no recovery by default
                    const c$ = assertDerivableAtom(factories.error('initial error'));
                    hot('-----a--b--c--d').subscribe({ next: v => c$.set(v) });
                    expectObservable(from(c$.connected$)).toBe('(ftf)-t-----f--', { t: true, f: false });
                    expectObservable(from(c$)).toBe('#', undefined, 'initial error');
                    expectObservable(from(c$), '------^-----!--').toBe('------a-b--c---');
                },
            );
        });
    });
}

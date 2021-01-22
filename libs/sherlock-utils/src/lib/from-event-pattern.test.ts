import { atom, Derivable, DerivableAtom, isDerivableAtom } from '@skunkteam/sherlock';
import { fromEventPattern } from './from-event-pattern';

describe('sherlock-utils/fromEventPattern', () => {
    const until = atom(false);
    beforeEach(() => until.set(false));
    afterEach(() => until.set(true));

    const reactor = jest.fn<void, [value: string, stop: () => void]>();
    const onError = jest.fn<void, [error: unknown, stop: () => void]>();
    const afterShutdown = jest.fn<void, []>();
    const subscribeHandler = jest.fn<() => void, [value$: DerivableAtom<string>]>();
    const unsubscribeHandler = jest.fn<void, []>();

    beforeEach(() => {
        reactor.mockReset();
        subscribeHandler.mockReset();
        subscribeHandler.mockReturnValue(unsubscribeHandler);
        unsubscribeHandler.mockReset();
        onError.mockReset();
        afterShutdown.mockReset();
    });

    function getAtom(): DerivableAtom<any> {
        return subscribeHandler.mock.calls[subscribeHandler.mock.calls.length - 1][0];
    }

    it('should start as `unresolved`', () => {
        const d$ = fromEventPattern(subscribeHandler);
        expect(d$.resolved).toBeFalse();
    });

    it('should handle synchronous finalization', () => {
        subscribeHandler.mockImplementation(v$ => {
            v$.setFinal('value');
            return unsubscribeHandler;
        });
        const d$ = fromEventPattern(subscribeHandler);
        d$.react(reactor, { onError, afterShutdown });
        expect(unsubscribeHandler).toHaveBeenCalledAfter(subscribeHandler);
        expect(reactor).toHaveBeenCalledAfter(subscribeHandler);
        expect(afterShutdown).toHaveBeenCalledAfter(unsubscribeHandler);
        expect(onError).not.toHaveBeenCalled();
    });

    describe('when the first connection to the `Derivable` starts', () => {
        let d$: Derivable<string>;
        beforeEach(() => (d$ = fromEventPattern(subscribeHandler)));
        beforeEach(() => d$.react(reactor, { until, onError }));

        it('should subscribe using the `addHandler`', () => {
            expect(subscribeHandler).toHaveBeenCalled();
        });

        it('should not call `addHandler` more than once', () => {
            expect(subscribeHandler).toHaveBeenCalledTimes(1);
            d$.react(reactor, { until });
            expect(d$.value).toBeUndefined();
            d$.react(reactor, { until });
            expect(subscribeHandler).toHaveBeenCalledTimes(1);
        });

        it('should call the `addHandler` with the DerivableAtom', () => {
            expect(isDerivableAtom(getAtom())).toBeTrue();
        });

        it('should not resolve before getting a value', () => {
            expect(reactor).not.toHaveBeenCalled();
        });

        describe('after the first value is emitted', () => {
            const value = 'first value';
            beforeEach(() => getAtom().set(value));

            it('should resolve the `Derivable`', () => {
                expect(d$.resolved).toBe(true);
            });

            it('should output the value', () => {
                expect(reactor).toHaveBeenCalledTimes(1);
                expect(reactor).toHaveBeenLastCalledWith('first value', expect.toBeFunction());
            });

            it('should output any errors', () => {
                const error = new Error('My Error');
                getAtom().setError(error);
                expect(onError).toHaveBeenCalledTimes(1);
                expect(onError).toHaveBeenCalledWith(error, expect.toBeFunction());
                expect(d$.error).toBe(error);
            });

            it('should be able to `get()` the latest value', () => {
                expect(d$.get()).toBe(value);
            });

            describe('when the last connection to the `Derivable` stops', () => {
                beforeEach(() => until.set(true));

                it('should unsubscribe using the `removeHandler`', () => {
                    expect(unsubscribeHandler).toHaveBeenCalledTimes(1);
                });
                it('should return to being `unresolved`', () => {
                    expect(d$.resolved).toBe(false);
                });
                it('should be able to start a connection again', () => {
                    reactor.mockReset();
                    const stop = d$.react(reactor);

                    expect(subscribeHandler).toHaveBeenCalledTimes(2);

                    expect(d$.resolved).toBe(false);

                    const val = 'second value';
                    getAtom().set(val);
                    expect(d$.resolved).toBe(true);
                    expect(reactor).toHaveBeenCalledTimes(1);
                    expect(reactor).toHaveBeenLastCalledWith(val, expect.toBeFunction());

                    stop();
                });
            });
        });
    });
});

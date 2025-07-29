import { atom, DerivableAtom } from '@skunkteam/sherlock';

/**
 * Errors are a bit part of any programming language, and Sherlock has its own custom errors
 * and ways to deal with them.
 */
describe('errors', () => {
    let myAtom$: DerivableAtom<number>;

    beforeEach(() => {
        myAtom$ = atom(1);
    });

    it('basic errors', () => {
        // The `errored` property of a Derivable shows whether it is in an error state - meaning that
        // the last statement resulted in an error
        expect(myAtom$.errored).toBe(false);
        expect(myAtom$.error).toBeUndefined; // by default, the `error` message is undefined.

        // We can set errors using the `setError()` function.
        myAtom$.setError('my Error');

        expect(myAtom$.errored).toBe(true);
        expect(myAtom$.error).toBe('my Error');

        // What will happen if you try to call `get()` on `myAtom$`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.get()).toThrow('my Error');

        // ** __YOUR_TURN__ **
        // What will happen if you try to call `set()` on `myAtom$`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.set(2)).not.toThrow();
        expect(myAtom$.errored).toBe(false);

        // Interestingly, calling `set()` does not throw an error. In fact, it removes the error state
        // altogether. This means we can now call `get()` again.
        expect(() => myAtom$.get()).not.toThrow();
    });

    it('deriving an error', () => {
        const myDerivable$ = myAtom$.derive(v => v + 1);

        // If `myAtom$` suddenly errors...
        myAtom$.setError('division by zero');

        // ...what happens to `myDerivable$`?
        expect(myDerivable$.errored).toBe(true);

        // If any Derivable tries to derive from an atom in an error state,
        // this Derivable will itself throw an error too. This makes sense,
        // given that it cannot obtain the value it needs.
    });

    it('reacting to an error', () => {
        // Setting an error to an Atom generally does not throw an error.
        expect(() => myAtom$.setError('my Error')).not.toThrow();

        myAtom$.set(1);

        // Now we set a reactor to `myAtom$`. However, this reactor does not use the value of `myAtom$`.
        const reactor = jest.fn(); // empty function body
        myAtom$.react(reactor);

        // ** __YOUR_TURN__ **
        // Will an error be thrown when `myAtom$` is now set to an error state?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.setError('my Error')).toThrow('my Error');

        // ** __YOUR_TURN__ **
        // Is the reactor still connected now that it errored?
        expect(myAtom$.connected).toBe(false);

        // Reacting to a Derivable that throws an error will make the reactor throw as well.
        // Because the reactor will usually fire when it gets connected, it also throws when
        // you try to connect it after the error has already been set.

        myAtom$ = atom(1);
        myAtom$.setError('my second Error'); //

        // ** __YOUR_TURN__ **
        // Will an error be thrown when you use `skipFirst`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.react(reactor, { skipFirst: true })).toThrow('my second Error');

        // And will an error be thrown when `from = false`?
        // `.toThrow()` or `.not.toThrow()`? ↴
        expect(() => myAtom$.react(reactor, { from: false })).not.toThrow();

        // When `from = false`, the reactor is disconnected, preventing the error message from entering.
        // `skipFirst`, on the other hand, does allow the error in, but does not trigger an update.
    });
});
